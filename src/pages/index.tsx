import { CredentialType, IDKitWidget } from "@worldcoin/idkit";
import type { ISuccessResult } from "@worldcoin/idkit";
import type { VerifyReply } from "./api/verify";
import { questions, Question } from '../data/questions';
import React, { useState, useRef, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import confetti from 'canvas-confetti';



export default function Home() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [sliderValue, setSliderValue] = useState(5);
	const [questionsDone, setQuestionDone] = useState(false);
	const [values, setValues] = useState<(number|boolean|ToggleValue)[]>([]);
	const [successMessage, setSuccessMessage] = useState("");
	const [count, setCount] = useState(3);
	const [isCountingDown, setIsCountingDown] = useState(false);

	useEffect(() => {
		if (isCountingDown && count > 0) {
		  setTimeout(() => setCount(count - 1), 1000);
		} else if (isCountingDown && count === 0) {
		  startRecording(); // Start recording when count is 0
		}
	}, [count, isCountingDown]);


	let app;
	const firebaseConfig = {
		apiKey: process.env.NEXT_PUBLIC_WLD_apiKey,
		authDomain: process.env.NEXT_PUBLIC_WLD_authDomain,
		projectId: process.env.NEXT_PUBLIC_WLD_projectId,
		storageBucket: process.env.NEXT_PUBLIC_WLD_storageBucket,
		messagingSenderId: process.env.NEXT_PUBLIC_WLD_messagingSenderId,
		appId: process.env.NEXT_PUBLIC_WLD_appId,
		measurementId: process.env.NEXT_PUBLIC_WLD_measurementId
	  };
	
	  if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0]; // if Firebase app is already initialized, use the existing app
      }

	const db = getFirestore(app);
	const storage = getStorage(app);

	async function addDataWorldCoin(votes:(number|boolean|ToggleValue)[], worldCoinID:string) {
		try {

		  const docRef = await addDoc(collection(db, "Vote1"), {
			Votes: votes,
			WorldCoinID: worldCoinID
		  });

	  
		  console.log("Document written with ID: ", docRef.id);
		} catch (e) {
		  console.error("Error adding document: ", e);
		}
	}

	const handleSubmit = () => {
        // Here you would usually send the sliderValue to your server
        console.log(`Question: ${questions[currentQuestionIndex].title}, Rating: ${sliderValue}, Toggle: ${toggleValue3}, Current ${currentQuestionIndex}`);

		let uploadedValue = questions[currentQuestionIndex].yesno ? toggleValue3 : sliderValue;

		setValues([...values, uploadedValue]);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSliderValue(5);
			setToggleValue3('undecided');
        } else {
			setQuestionDone(true)
		}
    }

	const onSuccess = (result: ISuccessResult) => {
		// This is where you should perform frontend actions once a user has been verified, such as redirecting to a new page
		// window.alert("Successfully verified with World ID! Your nullifier hash is: " + result.nullifier_hash);

		setSuccessMessage("Successfully verified with World ID!");

		addDataWorldCoin(values, result.nullifier_hash);
	};

	const handleProof = async (result: ISuccessResult) => {
		console.log("Proof received from IDKit:\n", JSON.stringify(result)); // Log the proof from IDKit to the console for visibility
		const reqBody = {
			merkle_root: result.merkle_root,
			nullifier_hash: result.nullifier_hash,
			proof: result.proof,
			credential_type: result.credential_type,
			action: process.env.NEXT_PUBLIC_WLD_ACTION_NAME,
			signal: "",
		};
		console.log("Sending proof to backend for verification:\n", JSON.stringify(reqBody)) // Log the proof being sent to our backend for visibility
		const res: Response = await fetch("/api/verify", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(reqBody),
		})
		const data: VerifyReply = await res.json()
		if (res.status == 200) {
			console.log("Successful response from backend:\n", data); // Log the response from our backend for visibility
		} else {
			throw new Error(`Error code ${res.status} (${data.code}): ${data.detail}` ?? "Unknown error."); // Throw an error if verification fails
		}
	};

	////////// VIDEO BUSINESS
	const [isRecording, setIsRecording] = useState<boolean>(false);

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const receivedVideoRef = useRef<HTMLVideoElement>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const recordedChunksRef = useRef<Blob[]>([]);
	const [videoURL, setVideoURL] = useState("");
	const recordingStopped = useRef(false);
	const [submittedToFirebase, setSubmittedToFirebase] = useState(false);
	const [usingWorldID, setUsingWorldID] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	const startRecordingCountdown = () => {
		setIsCountingDown(true);
	};

	const startRecording = async () => {
		setIsCountingDown(false);
		setIsRecording(true);
		try {
		  const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
		  if (localVideoRef.current) {
			localVideoRef.current.srcObject = stream;
		  }
		  mediaRecorderRef.current = new MediaRecorder(stream);
		  mediaRecorderRef.current.ondataavailable = handleDataAvailable;
		  mediaRecorderRef.current.onstop = handleStop;
		  recordedChunksRef.current = [];
		  mediaRecorderRef.current.start();
		} catch (error) {
		  console.error('Error accessing media devices:', error);
		}
	};

	const handleDataAvailable = (event: any) => {
		if (event.data.size > 0) {
		  recordedChunksRef.current.push(event.data);
		}
	  };
	
	  const handleStop = () => {
		const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
		console.log('Recorded Blob:', blob);
		if (receivedVideoRef.current) {
		  receivedVideoRef.current.src = URL.createObjectURL(blob);
		}

		const storageRef = ref(storage, `videos/${new Date().getTime()}.webm`);
	
		// Upload to Firebase Storage
		const uploadTask = uploadBytesResumable(storageRef, blob);
  
		uploadTask.on('state_changed',
		  (snapshot) => {
			const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
			console.log('Upload is ' + progress + '% done');

			setUploadProgress(Math.floor(progress));
		  }, 
		  (error) => {
			console.error('Upload failed:', error);
		  }, 
		  () => {
			getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
			  console.log('File available at', downloadURL);
			  setVideoURL(downloadURL);
			});
		  }
		);
	  };
	
	  const stopRecording = () => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
		  mediaRecorderRef.current.stop();
		  
		}
		recordingStopped.current = true;
		console.log('Recording Stopped:', recordingStopped.current);
	  };

		async function submitFirebase() {
			if (buttonRef.current) {
				const buttonRect = buttonRef.current.getBoundingClientRect(); // Get the position of the button
				const xPos = buttonRect.left + buttonRect.width / 2; // Get the X position of the center of the button
				const yPos = buttonRect.top + buttonRect.height / 2; // Get the Y position of the center of the button
			
				confetti({
				particleCount: 100,
				spread: 70,
				origin: {
					x: xPos / window.innerWidth, // Convert the X position to a ratio of the viewport width
					y: yPos / window.innerHeight // Convert the Y position to a ratio of the viewport height
				}
				});
			}


			const docRef = await addDoc(collection(db, "Vote1"), {
			Votes: values,
			WebcamRecording: videoURL
			});

			console.log("Document written with ID: ", docRef.id);
			setSubmittedToFirebase(true);



		}

	// Additional function to hide the webcam recording button
	const handleOpenClick = () => {
		setUsingWorldID(true);
		console.log('Button clicked and additional handlers executed');
	};

	// const [toggleValue, setToggleValue] = useState(false);

	// const toggle = () => {
	// 	setToggleValue(!toggleValue);
	// };

	type ToggleValue = 'undecided' | 'yes' | 'no';
	const [toggleValue3, setToggleValue3] = useState<ToggleValue>('undecided');

	const buttonRef = useRef<HTMLButtonElement | null>(null);

	return (
		<>

		{!questionsDone && 
			<div>
				<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">

					<div className="max-w-md w-full bg-white p-6 rounded shadow">
						<h2 className="text-2xl font-semibold mb-2">{questions[currentQuestionIndex].title}</h2>
						<p className="text-gray-600 mb-4">{questions[currentQuestionIndex].description}</p>
	
							{
								questions[currentQuestionIndex].yesno ? (
									// Toggle
									<div className="flex items-center mb-4">


	<div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4">
      <div className="flex items-center">
        <div className="flex items-center text-gray-700 mr-3">
          <input type="radio" className="form-radio h-5 w-5 text-gray-600" checked={toggleValue3 === 'undecided'} onChange={() => setToggleValue3('undecided')} />
          <label className="ml-2 text-sm text-gray-700">Undecided</label>
        </div>
        <div className="flex items-center text-gray-700 mr-3">
          <input type="radio" className="form-radio h-5 w-5 text-gray-600" checked={toggleValue3 === 'yes'} onChange={() => setToggleValue3('yes')} />
          <label className="ml-2 text-sm text-gray-700">Yes</label>
        </div>
        <div className="flex items-center text-gray-700 mr-3">
          <input type="radio" className="form-radio h-5 w-5 text-gray-600" checked={toggleValue3 === 'no'} onChange={() => setToggleValue3('no')} />
          <label className="ml-2 text-sm text-gray-700">No</label>
        </div>
      </div>
    </div>



									{/* <label
										htmlFor="toggle"
										className={`${
										toggleValue ? "bg-blue-600" : "bg-gray-300"
										} relative inline-block w-12 rounded-full h-6 transition-colors duration-200 ease-in-out cursor-pointer`}
									>
										<input
										id="toggle"
										type="checkbox"
										className="opacity-0 w-0 h-0"
										checked={toggleValue}
										onChange={() => setToggleValue(!toggleValue)}
										/>
										<span
										className={`${
											toggleValue ? "translate-x-6" : "translate-x-1"
										} inline-block w-5 h-5 bg-white rounded-full transform transition-transform duration-200 ease-in-out`}
										/>
									</label>
									<span className="ml-3 text-gray-700 font-medium">
										{toggleValue ? "Yes" : "No"}
									</span> */}
									</div>





								) : (
									// Slider
									<div className="flex items-center mb-4">
									<input
										type="range"
										min="0"
										max="10"
										step="0.1"
										value={sliderValue}
										onChange={(e) => setSliderValue(parseFloat(e.target.value))}
										className="flex-grow mr-2"
									/>
									<span>{sliderValue}</span>
									</div>
								)
								}

						<button onClick={handleSubmit} className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600">Submit</button>
					</div>
				</div>
			</div>
		}

		{ questionsDone && 
			<div>
				<div className="flex flex-col items-center justify-center h-auto overflow-auto my-12">

					{questions.map((question, index) => (
						<div key={index} className="max-w-md w-full bg-white p-6 rounded shadow mb-4">
							<h2 className="text-2xl font-semibold mb-2">{question.title}</h2>
							{question.yesno ? (
								// Toggle
								<div className="flex items-center mb-4">
									{/* <label
										htmlFor={`toggle-${index}`}
										className={`${
											values[index] ? "bg-blue-600" : "bg-gray-300"
										} relative inline-block w-12 rounded-full h-6 transition-colors duration-200 ease-in-out cursor-pointer`}
									>
										<input
											id={`toggle-${index}`}
											type="checkbox"
											className="opacity-0 w-0 h-0"
											checked={!!values[index]}
											readOnly
										/>
										<span
											className={`${
												values[index] ? "translate-x-6" : "translate-x-1"
											} inline-block w-5 h-5 bg-white rounded-full transform transition-transform duration-200 ease-in-out`}
										/>
									</label>
									<span className="ml-3 text-gray-700 font-medium">
										{values[index] ? "Yes" : "No"}
									</span> */}


									<div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4">
										<div className="flex items-center">
											<div className="flex items-center text-gray-700 mr-3">
												<input type="radio" className="form-radio h-5 w-5 text-gray-600" checked={values[index] === 'undecided'} disabled/>
												<label className="ml-2 text-sm text-gray-700">Undecided</label>
											</div>
											<div className="flex items-center text-gray-700 mr-3">
												<input type="radio" className="form-radio h-5 w-5 text-gray-600" checked={values[index] === 'yes'} disabled/>
												<label className="ml-2 text-sm text-gray-700">Yes</label>
											</div>
											<div className="flex items-center text-gray-700 mr-3">
												<input type="radio" className="form-radio h-5 w-5 text-gray-600" checked={values[index] === 'no'} disabled/>
												<label className="ml-2 text-sm text-gray-700">No</label>
											</div>
										</div>
									</div>

									
								</div>
							) : (
								// Slider
								<div className="flex items-center mb-4">
									<input 
										type="range" 
										min="1" 
										max="10" 
										value={typeof values[index] === 'number' ? values[index] : 1}
										className="flex-grow mr-2"
										readOnly
									/>
									<span>{values[index]}</span>
								</div>
							)}
						</div>
					))}

					{ !(isRecording || recordingStopped.current) && !successMessage && <IDKitWidget
						action={process.env.NEXT_PUBLIC_WLD_ACTION_NAME!}
						app_id={process.env.NEXT_PUBLIC_WLD_APP_ID!}
						onSuccess={onSuccess}
						handleVerify={handleProof}
						credential_types={[CredentialType.Orb, CredentialType.Phone]}
						autoClose
					>
						{({ open }) =>
							<button className="border border-black rounded-md"onClick={() => {
								handleOpenClick();
								open();
							  }}>
								<div className="mx-3 my-1">Verify with World ID</div>
							</button>
						}

					</IDKitWidget>}
					
					<div className="text-green-500">{successMessage}</div>

				{!usingWorldID &&
					<div>
						{ !isRecording &&
								<button className="border border-black rounded-md" onClick={startRecordingCountdown} >
									<div className="mx-3 my-1">Verify with selfie video</div>
								</button>
						}
						{ isRecording && !recordingStopped.current &&
							<button className="border border-black rounded-md" onClick={stopRecording} >
								<div className="mx-3 my-1">Stop recording</div>
							</button>
						}

						{ isCountingDown && <h1 className="text-xl">{count}</h1>}
						
						{ isRecording && !recordingStopped.current && <video ref={localVideoRef} width="320" height="240" autoPlay muted /> }

						{ !videoURL && recordingStopped.current && <p>Upload progress: { uploadProgress }%</p> }
						{ videoURL && !submittedToFirebase && <p>Upload done ✅</p> }

						<div style={{ display: videoURL && !submittedToFirebase ? 'block' : 'none' }}>
							<h2>Recorded video:</h2>
							<video ref={receivedVideoRef} width="320" height="240" controls />
							
							<button className="border border-black rounded-md" ref={buttonRef} onClick={submitFirebase} >
								<div className="mx-3 my-1">Submit data & uploaded video</div>
							</button>
						</div>

						{ submittedToFirebase && <div className="text-green-500">Successfully submitted data to Firebase!</div>}
					</div>
				}
				</div>
			</div>
		}
		</>
	);
}
