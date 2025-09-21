import React from "react";
import { HiArrowLongRight } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const StartNow = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-[#FFFBF0]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left: Copy */}
          <div className="text-center lg:text-left">
            <div className="mb-6 flex flex-col gap-2">
              <h1 className="text-[#4D4D4D] text-4xl sm:text-5xl lg:text-6xl xl:text-6xl font-semibold leading-tight">
                The smartest way to
              </h1>
              <h2 className="text-[#E7B904] text-4xl sm:text-5xl lg:text-6xl xl:text-6xl font-semibold leading-tight">
                remember
              </h2>
            </div>

            <p className="text-[#4D4D4D] text-base sm:text-md max-w-2xl mx-auto lg:mx-0">
              A smarter game designed to help you recall what matters, anytime and anywhere
            </p>

            <div className="mt-8">
              <button
                onClick={() => navigate("/user")}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E7B904] px-6 py-3 text-white text-base sm:text-lg font-medium hover:opacity-90 active:scale-[0.99] transition"
              >
                Start Now <HiArrowLongRight className="text-2xl" />
              </button>
            </div>
          </div>

          {/* Right: Image */}
          <div className="flex justify-center lg:justify-end">
            <img
              src="../Image 2.png"
              alt="Reminder app illustration"
              className="w-[320px] sm:w-[420px] lg:w-[480px] h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StartNow;
