import React from 'react';

import { useEffect, useState } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

interface VoteData {
    votes: number[];
    worldID: boolean;
  }

const Display: React.FC = () => {

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

    const [data, setData] = useState<VoteData[]>([]);
    
    const fetchDataFromFirestore = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Vote1'));
        const data = querySnapshot.docs.map((doc: any) => ({
          id: doc.id,
          Votes: doc.get('Votes'),
          WorldCoinID: doc.get('WorldCoinID'),
        }));

        const processedData = data.map(item => {
            return {
                votes: item.Votes,
                worldID: !!item.WorldCoinID
            }
        })

        setData(processedData);

        return data;
      } catch (error) {
        console.error('Error fetching data from Firestore:', error);
        return [];
      }
    };

    fetchDataFromFirestore()
    

  return (
    <div>
      <h1>Firestore Data</h1>
      <ul>
        {data.map((item, index) => (
          <li key={index}>
            <strong>Votes:</strong> {item.votes.join(', ')}, <strong>WorldID:</strong> {item.worldID.toString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Display;