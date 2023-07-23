import React from 'react';

import { useEffect, useState } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

interface VoteData {
    votes: number[];
    worldID: boolean;
  }

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