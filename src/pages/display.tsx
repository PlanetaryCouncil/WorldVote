import React from 'react';

import { useEffect, useState } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const NewPage: React.FC = () => {

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
    
    const fetchDataFromFirestore = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Vote1'));
        const data = querySnapshot.docs.map((doc: any) => ({
          id: doc.id,
          Votes: doc.get('Votes'),
          WorldCoinID: doc.get('WorldCoinID'),
        }));

        //// WE ARE GETTING DATA ! ! ! ! (need nice charts)
        console.log('Data from Firestore:', data);

        return data;
      } catch (error) {
        console.error('Error fetching data from Firestore:', error);
        return [];
      }
    };

    fetchDataFromFirestore()
    

  return (
    <div>
      <h1>New Page</h1>
      <p>This is a new page in Next.js with React and TypeScript. Greg can handle the display data maybe?</p>
    </div>
  );
};

export default NewPage;