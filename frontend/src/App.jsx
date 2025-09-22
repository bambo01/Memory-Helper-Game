import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import "./App.css";
import RootLayout from "./RootLayout";
import SignIn from "./Page/SignIn";
import SignUp from "./Page/SignUp";
import UserRootLayout from "./Page/UserRootLayout";
import Home from "./Page/Home";
import Quiz from "./Page/Quiz";
import AddFlashCard from "./Page/AddFlashCard";
import FlashCard from "./Page/FlashCard";
import EditData from "./Component/EditData";
import LandingPage from "./Page/LandingPage";
import PackPicker from "./Component/Quiz/PackPicker";
import QuizPage from "./Component/Quiz/QuizPage";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public layout */}
      <Route path="/" element={<RootLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="signup" element={<SignUp />} />
      </Route>

      {/* User layout */}
      <Route path="/user" element={<UserRootLayout />}>
        <Route index element={<Home />} />
        {/* Optional duplicate; remove if you prefer just the index */}
        <Route path="home" element={<Home />} />
        <Route path="add" element={<AddFlashCard />} />
         <Route path="flashcard" element={<FlashCard />} />
         <Route path="edit" element={<EditData />} />

         <Route path="packs" element={<PackPicker />} />
          
         <Route path="quiz/:tokenId" element={<QuizPage />} />  
        

        <Route path="quiz" element={<Quiz />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
    </>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}
