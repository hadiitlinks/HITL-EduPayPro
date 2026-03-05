import React,{useState,useEffect} from "react";
import { db } from "../firebase";
import { collection,addDoc,getDocs } from "firebase/firestore";

export default function StudentManager(){
  const [name,setName]=useState("");
  const [father,setFather]=useState("");
  const [roll,setRoll]=useState("");
  const [contact,setContact]=useState("");
  const [cls,setCls]=useState("");
  const [classes,setClasses]=useState([]);

  useEffect(()=>{
    getDocs(collection(db,"classes")).then(s=>{
      setClasses(s.docs.map(d=>({id:d.id,...d.data()})));
    });
  },[]);

  const save=async(e)=>{
    e.preventDefault();
    await addDoc(collection(db,"students"),{
      name,father,roll,contact,classId:cls
    });
    setName("");setFather("");setRoll("");setContact("");setCls("");
  };

  return(
    <div>
      <h2>Student Registration</h2>
      <form onSubmit={save}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Student Name" required/>
        <input value={father} onChange={e=>setFather(e.target.value)} placeholder="Father Name" required/>
        <input value={roll} onChange={e=>setRoll(e.target.value)} placeholder="Roll" required/>
        <input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Contact" required/>

        <select value={cls} onChange={e=>setCls(e.target.value)} required>
          <option value="">Select Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button>Save Student</button>
      </form>
    </div>
  );
}