// src/Page/Home.jsx
import { useNavigate } from "react-router-dom";



const Home = () => {
  const navigate = useNavigate();


 

  return (
    <div className="relative min-h-[830px] flex items-center justify-center md:px-4">
      {/* 👇 Main Home Content (always visible) */}
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          {/* Quiz Mode */}
          <button
            className="rounded-2xl border border-gray-200 bg-white
             px-8 py-6 text-xl font-semibold shadow-[0_4px_4px_rgba(0,0,0,1)]
             hover:border-[#E7B904] hover:border-3 
             focus:outline-none focus:ring-2 focus:ring-blue-500 
             transition-all duration-300 lg:w-100"
            onClick={() => navigate("/user/quiz")}
          >
            <div className="flex flex-col items-center gap-3 text-center text-2xl drop-shadow-lg">
              <img src="/quizA.png" alt="Quiz Mode" className="w-80 mx-auto" />
              <span>Quiz Mode</span>
              <p className="text-sm font-light">Quick Recall Game</p>
            </div>
          </button>

          {/* Flashcard Mode */}
          <button
            className="rounded-2xl border border-gray-200 bg-white
             px-8 py-6 text-xl font-semibold shadow-[0_4px_4px_rgba(0,0,0,1)]
             hover:border-[#E7B904] hover:border-3
             focus:outline-none focus:ring-2 focus:ring-blue-500 
             transition-all duration-300 lg:w-100"
            onClick={() => navigate("/user/flashcard")}
          >
            <div className="flex flex-col items-center gap-3 text-center text-2xl drop-shadow-lg">
              <img src="/flash.png" alt="Flashcard Mode" className="w-80 mx-auto" />
              <span>Flashcard Mode</span>
              <p className="text-sm font-light">Flashback Learning Cards</p>
            </div>
          </button>
        </div>

        {/* Create Memory Pack */}
        <div>
          <button
            className="text-md md:text-2xl flex items-center font-semibold px-8 py-2 rounded-full border border-white/20 
             bg-white shadow-[0_4px_4px_rgba(0,0,0,1)]"
            onClick={() => navigate("/user/add")}
          >
            Create Memory Pack
          </button>
        </div>
      </div>

  
      
    </div>
  );
};

export default Home;
