import React, { useState, useEffect, useRef } from "react";
import { CiCirclePlus } from "react-icons/ci";
import { MdDeleteSweep } from "react-icons/md";

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { firebaseConfig } from "../Script";
import Navbar from "./Navbar";

function ToDoList() {
  const app = initializeApp(firebaseConfig);
  const navigate = useNavigate();
  const analytics = getAnalytics(app);
  const db = getFirestore(app);
  const text = useRef(null);
  const [todoList, setTodoList] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth(app);
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isMounted) {
        setUser(user);

        if (user) {
          fetchData(user.uid);
        } else {
          // If user is not authenticated, clear the to-do list
          navigate("/");
          setTodoList([]);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [app, navigate]);

  const fetchData = async (userId) => {
    const todoCollection = collection(db, `users/${userId}/todo_items`);
    const querySnapshot = await getDocs(todoCollection);
    const todos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(todos);
    setTodoList(todos);
  };

  useEffect(() => {
    fetchData();
  }, [db]);

  const addItem = async (event) => {
    event.preventDefault();

    try {
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      const userId = user.uid;
      const todoCollection = collection(db, `users/${userId}/todo_items`);

      const docRef = await addDoc(todoCollection, {
        text: text.current.value,
        status: "active",
      });

      fetchData(userId);
      text.current.value = "";
      console.log("Document written with ID:", docRef.id);
    } catch (error) {
      console.error("Error adding document:", error);
    }
  };

  const deleteItem = async (id) => {
    try {
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      const userId = user.uid;
      await deleteDoc(doc(db, `users/${userId}/todo_items`, id));
      fetchData(userId);
      console.log("Document deleted with ID:", id);
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-gray-200">
        <div className="w-screen min-h-screen justify-center items-center">
          <div
            className={`
              flex flex-wrap px-5 md:px-0 lg:px-10 relative md:w-[75%]  gap-3 md:gap-4 lg:gap-10`}
          >
            <div className="bg-white flex flex-col justify-center items-center w-[48%] min-w-[140px] md:min-w-[180px] lg:min-w-[200px] md:w-[40%] lg:w-[22%] rounded-lg mt-16 md:mt-10 p-16 relative cursor-pointer hover:border-gray-300 shadow-md hover:shadow-none">
              <div className="flex flex-col justify-center items-center">
                <CiCirclePlus
                  size={30}
                  className="text-base text-yellow-300"
                />
                <form
                  onSubmit={addItem}
                  className="text-center"
                >
                  <input
                    id="todo_input"
                    type="text"
                    placeholder="Create a new todo"
                    ref={text}
                    className="w-full text-sm"
                  />
                </form>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap px-5 md:px-0 lg:px-10 relative md:w-[100%]  gap-3 md:gap-4 lg:gap-10">
            {todoList.map((todo) => (
              <div
                key={todo.id}
                className="bg-green-300 w-[48%] min-w-[140px] md:min-w-[180px] lg:min-w-[200px] md:w-[40%] lg:w-[22%] rounded-lg mt-16 md:mt-10 p-16 relative hover:border-gray-300 shadow-md hover:shadow-none"
              >
                <span className=" flex flex-col justify-center items-center ">
                  {todo.text}
                </span>
                <MdDeleteSweep
                  size={20}
                  className="absolute bottom-0 right-0 m-1 text-black  cursor-pointer hover:text-red-500"
                  onClick={() => deleteItem(todo.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default ToDoList;
