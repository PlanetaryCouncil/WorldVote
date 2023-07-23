import React from "react";
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	BarElement,
	CategoryScale,
	LinearScale,
} from "chart.js";
import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { Bar, Pie } from "react-chartjs-2";
import { questions } from "@/data/questions";

interface VoteData {
	votes: number[];
	worldID: boolean;
}
ChartJS.register(
	ArcElement,
	Tooltip,
	CategoryScale,
	LinearScale,
	BarElement,
	Legend
);
const Display: React.FC = () => {
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

	const [data, setData] = useState<VoteData[]>([]);

	const fetchDataFromFirestore = async () => {
		try {
			const querySnapshot = await getDocs(collection(db, "Vote1"));
			const data = querySnapshot.docs.map((doc: any) => ({
				id: doc.id,
				Votes: doc.get("Votes"),
				WorldCoinID: doc.get("WorldCoinID"),
			}));

			const processedData = data.map((item) => {
				return {
					votes: item.Votes,
					worldID: !!item.WorldCoinID,
				};
			});

			setData(processedData);

			return data;
		} catch (error) {
			console.error("Error fetching data from Firestore:", error);
			return [];
		}
	};

	fetchDataFromFirestore();

	return (
		<div className="p-3 lg:py-4 lg:px-12">
			<p className=" text-3xl font-bold text-center mt-4 mb-12">
				Submitted questionaires info
			</p>
			{data[0]?.votes.map((_vote, index) => (
				<div className="my-3 card outline-black/10 outline shadow-md">
					<div className="card-body">
						<p className="mb-1 text-black/60">
							Responses for question {index + 1}<br/>
                            { questions[index].title }
						</p>
						<div className="max-w-md ml-auto">
							<Bar
								options={{
									indexAxis: "y" as const,
									elements: {
										bar: {
											borderWidth: 2,
										},
									},
									responsive: true,
								}}
								data={{
									labels: Array.from(
										{ length: data.length },
										(_, i) => `User ${i}`
									),
									datasets: [
										{
											data: Array.from(
												{ length: data.length! },
												(_, i) => data[i].votes[index]
											),
											label: "Vote",
											borderColor: "rgb(52, 79, 203)",
											backgroundColor: "rgba(99, 151, 255, 0.5)",
										},
									],
								}}
							/>
						</div>
					</div>
				</div>
			))}
			{/* Used for Mockup Reasons */}
			{/* <div className="my-3 card outline-black/10 outline shadow-md">
				<div className="card-body">
					<p className="mb-1 text-black/60">Responses for question #0</p>
					<div className="w-full ">
						<Bar
							className="lg:w-3/4 ml-auto"
							options={{
								indexAxis: "y" as const,
								elements: {
									bar: {
										borderWidth: 2,
									},
								},
								responsive: true,
							}}
							data={{
								labels: ["User 1", "User 2", "User 3"],
								datasets: [
									{
										data: [-2, -1, 4],
										label: "Vote",
										borderColor: "rgb(52, 79, 203)",
										backgroundColor: "rgba(99, 151, 255, 0.5)",
									},
								],
							}}
						/>
					</div>
				</div>
			</div> */}

			{/* <ul>
				{data.map((item, index) => (
					<li key={index}>
						<strong>Votes:</strong> {item.votes.join(", ")},{" "}
						<strong>WorldID:</strong> {item.worldID.toString()}
					</li>
				))}
			</ul> */}

            
		</div>
	);
};

export default Display;
