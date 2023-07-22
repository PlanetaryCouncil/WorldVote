import { CredentialType, IDKitWidget } from "@worldcoin/idkit";
import type { ISuccessResult } from "@worldcoin/idkit";
import type { VerifyReply } from "./api/verify";
import { questions, Question } from '../data/questions';
import React, { useState } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";


export default function Home() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [sliderValue, setSliderValue] = useState(5);
	const [questionsDone, setQuestionDone] = useState(false);
	const [values, setValues] = useState<number[]>([]);

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

	async function addData() {
		try {
		  const docRef = await addDoc(collection(db, "Votes"), {
			VoteID: "TEST TEST",
			Votes: [4, 5, 6, 7],
			WorldCoinID: "TEST"
		  });
	  
		  console.log("Document written with ID: ", docRef.id);
		} catch (e) {
		  console.error("Error adding document: ", e);
		}
	  }

	addData(); 


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
		window.alert("Successfully verified with World ID! Your nullifier hash is: " + result.nullifier_hash);
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
					
					<br />
					<br />
					<p className="text-2xl mb-5">Verify with selfie video</p>

				</div>
			</div>
		}
		</>
	);
}
