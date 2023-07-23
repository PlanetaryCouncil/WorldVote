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
			{data[0]?.votes.map((_vote, index) => {
				if (typeof _vote === "boolean" || typeof _vote === "string")
					return (
						<div className="my-3 card outline-black/10 outline shadow-md">
							<div className="card-body">
								<p className="mb-1 text-black/60">
									Responses for question {index + 1}<br/>
									<span className="text-2xl">{ questions[index].title }</span>
								</p>
								<div className="max-w-md ml-auto">
									<Pie
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
											labels: ["Yes", "No", "Undecided"],
											datasets: [
												{
													data: [
														//@ts-ignore can vote can be number,bool, string
														data.filter((item) => item.votes[index]! === true)
															.length,
														//@ts-ignore
														data.filter((item) => item.votes[index]! === false)
															.length,

														data.filter(
															//@ts-ignore
															(item) => item.votes[index]! === "undecided"
														).length,
													],
													label: "Vote",
													borderColor: [
														"rgba(54, 162, 235, 1)",
														"rgba(255, 99, 132, 1)",
														"rgba(153, 102, 255, 1)",
													],
													backgroundColor: [
														"rgba(54, 162, 235, 0.2)",
														"rgba(255, 99, 132, 0.2)",
														"rgba(153, 102, 255, 0.2)",
													],
												},
											],
										}}
									/>
								</div>
							</div>
						</div>
					);
				return (
					<div className="my-3 card outline-black/10 outline shadow-md">
						<div className="card-body">
							<p className="mb-1 text-black/60">
								Responses for question {index + 1}<br/>
								<span className="text-2xl">{ questions[index].title }</span>
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
												backgroundColor: [
													"rgba(255, 99, 132, 0.2)",
													"rgba(54, 162, 235, 0.2)",
													"rgba(255, 206, 86, 0.2)",
													"rgba(75, 192, 192, 0.2)",
													"rgba(153, 102, 255, 0.2)",
													"rgba(255, 159, 64, 0.2)",
												],
												borderColor: [
													"rgba(255, 99, 132, 1)",
													"rgba(54, 162, 235, 1)",
													"rgba(255, 206, 86, 1)",
													"rgba(75, 192, 192, 1)",
													"rgba(153, 102, 255, 1)",
													"rgba(255, 159, 64, 1)",
												],
											},
										],
									}}
								/>
							</div>
						</div>
					</div>
				);
			})}
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
										backgroundColor: [
											"rgba(255, 99, 132, 0.2)",
											"rgba(54, 162, 235, 0.2)",
											"rgba(255, 206, 86, 0.2)",
											"rgba(75, 192, 192, 0.2)",
											"rgba(153, 102, 255, 0.2)",
											"rgba(255, 159, 64, 0.2)",
										],
										borderColor: [
											"rgba(255, 99, 132, 1)",
											"rgba(54, 162, 235, 1)",
											"rgba(255, 206, 86, 1)",
											"rgba(75, 192, 192, 1)",
											"rgba(153, 102, 255, 1)",
											"rgba(255, 159, 64, 1)",
										],
									},
								],
							}}
						/>
					</div>
				</div>
			</div>
			<div className="my-3 card outline-black/10 outline shadow-md">
				<div className="card-body">
					<p className="mb-1 text-black/60">Responses for question #0</p>
					<div className="w-full ">
						<Pie
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
								labels: ["Yes", "No", "Undecided"],
								datasets: [
									{
										data: [23, 54, 12],
										label: "Vote",
										borderColor: [
											"rgba(54, 162, 235, 1)",
											"rgba(255, 99, 132, 1)",
											"rgba(153, 102, 255, 1)",
										],
										backgroundColor: [
											"rgba(54, 162, 235, 0.2)",
											"rgba(255, 99, 132, 0.2)",
											"rgba(153, 102, 255, 0.2)",
										],
									},
								],
							}}
						/>
					</div>
				</div>
			</div>
			<ul>
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
