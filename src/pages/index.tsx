import { CredentialType, IDKitWidget } from "@worldcoin/idkit";
import type { ISuccessResult } from "@worldcoin/idkit";
import type { VerifyReply } from "./api/verify";
import { questions, Question } from '../data/questions';
import React, { useState, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";


export default function Home() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [sliderValue, setSliderValue] = useState(5);
	const [questionsDone, setQuestionDone] = useState(false);
	const [values, setValues] = useState<number[]>([]);
	const [successMessage, setSuccessMessage] = useState("");


	const firebaseConfig = {
		apiKey: "AIzaSyDx2GdJQTszMTqNx2Q1hmYaFnrrFdWFGK8",
		authDomain: "worldvote-8f984.firebaseapp.com",
		projectId: "worldvote-8f984",
		storageBucket: "worldvote-8f984.appspot.com",
		messagingSenderId: "53279430852",
		appId: "1:53279430852:web:f6001b1f82140d122c5191",
		measurementId: "G-260B099L1M"
	  };
	
	const app = initializeApp(firebaseConfig);
	const db = getFirestore(app);
	const storage = getStorage(app);

	async function addDataWorldCoin(votes:number[], worldCoinID:string) {
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
        console.log(`Question: ${questions[currentQuestionIndex].title}, Rating: ${sliderValue}, Current ${currentQuestionIndex}`);

		setValues([...values, sliderValue]);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSliderValue(5);
        } else {
			setQuestionDone(true)
		}
    }

	const onSuccess = (result: ISuccessResult) => {
		// This is where you should perform frontend actions once a user has been verified, such as redirecting to a new page
		// window.alert("Successfully verified with World ID! Your nullifier hash is: " + result.nullifier_hash);

		setSuccessMessage("Successfully verified with World ID! Your nullifier hash is: " + result.nullifier_hash);

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

	const startRecording = async () => {
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
		  }, 
		  (error) => {
			console.error('Upload failed:', error);
		  }, 
		  () => {
			getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
			  console.log('File available at', downloadURL);
			  
			  // Save the download URL to Firestore
			  const docRef = await addDoc(collection(db, "Vote1"), {
				Votes: values,
				WebcamRecording: downloadURL
			  });
  
			  console.log("Document written with ID: ", docRef.id);
			});
		  }
		);




	  };
	
	  const stopRecording = () => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
		  mediaRecorderRef.current.stop();
		}
	  };

	/*

	const stopRecording = async () => {
		setIsRecording(false);
		if (mediaRecorderRef.current) {
		  mediaRecorderRef.current.stop();
		  if (stream) {
			stream.getTracks().forEach(track => track.stop());
		  }
	
		  mediaRecorderRef.current.ondataavailable = null;
		  mediaRecorderRef.current.onstop = null;
	
		  const blob = new Blob(recordedChunks, { type: 'video/webm' });

		  console.log(blob);

		  const storageRef = ref(storage, `videos/${new Date().getTime()}.webm`);
	
		  // Upload to Firebase Storage
		  const uploadTask = uploadBytesResumable(storageRef, blob);
	
		  uploadTask.on('state_changed',
			(snapshot) => {
			  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
			  console.log('Upload is ' + progress + '% done');
			}, 
			(error) => {
			  console.error('Upload failed:', error);
			}, 
			() => {
			  getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
				console.log('File available at', downloadURL);
				
				// Save the download URL to Firestore
				const docRef = await addDoc(collection(db, "Vote1"), {
				  Votes: values,
				  WebcamRecording: downloadURL
				});
	
				console.log("Document written with ID: ", docRef.id);
			  });
			}
		  );
		}
	};

	*/

	return (
		<>
		{!questionsDone && 
			<div>
				<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
					<div className="max-w-md w-full bg-white p-6 rounded shadow">
						<h2 className="text-2xl font-semibold mb-2">{questions[currentQuestionIndex].title}</h2>
						<p className="text-gray-600 mb-4">{questions[currentQuestionIndex].description}</p>
						<div className="flex items-center mb-4">
							<input type="range" min="0" max="10" step="0.1" value={sliderValue} onChange={(e) => setSliderValue(parseFloat(e.target.value))} className="flex-grow mr-2"/>
							<span>{sliderValue}</span>
						</div>
						<button onClick={handleSubmit} className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600">Submit</button>
					</div>
				</div>
			</div>
		}

		{ questionsDone && 
			<div>
				<div className="flex flex-col items-center justify-center align-middle h-screen">

				{questions.map((question, index) => (
                <div key={index} className="max-w-md w-full bg-white p-6 rounded shadow mb-4">
                    <h2 className="text-2xl font-semibold mb-2">{question.title}</h2>
                    <div className="flex items-center mb-4">
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={values[index]}
                            className="flex-grow mr-2"
							readOnly
                        />
						<span>{values[index]}</span>
                    </div>
                </div>
            ))}


					<p className="text-2xl mb-5">World ID Cloud Template</p>
					<IDKitWidget
						action={process.env.NEXT_PUBLIC_WLD_ACTION_NAME!}
						app_id={process.env.NEXT_PUBLIC_WLD_APP_ID!}
						onSuccess={onSuccess}
						handleVerify={handleProof}
						credential_types={[CredentialType.Orb, CredentialType.Phone]}
						autoClose
					>
						{({ open }) =>
							<button className="border border-black rounded-md" onClick={open}>
								<div className="mx-3 my-1">Verify with World ID</div>
							</button>
						}

					</IDKitWidget>

					<div className="text-green-500">{successMessage}</div>
					
					<br />
					<br />
					<p className="text-2xl mb-5">Verify with selfie video</p>

					<div>
						<button onClick={startRecording} disabled={isRecording}>Start recording</button>
						<button onClick={stopRecording} disabled={!isRecording}>Stop recording</button>
						
						<video ref={localVideoRef} width="320" height="240" autoPlay muted />
						<hr />
						<h2>Received Blob:</h2>
						<video ref={receivedVideoRef} width="320" height="240" controls />
    
					</div>

				</div>
			</div>
		}
		</>
	);
}
