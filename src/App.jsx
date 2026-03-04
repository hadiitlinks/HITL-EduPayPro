import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

function App() {
  const [students, setStudents] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      setStudents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error("Error:", e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">EduPay Pro - System Online</h1>
      <p>Total Students in Cloud: {students.length}</p>
    </div>
  );
}
export default App;