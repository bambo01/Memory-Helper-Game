import React from "react";

const Benefits = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      {/* Header */}
      <header className="text-center text-[#4D4D4D]">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-3 sm:mb-4">
          Who benefits?
        </h2>
        <p className="text-sm sm:text-base">
          Helping elderly users, families, and caregivers stay connected.
        </p>
      </header>

      {/* Cards */}
      <div
        className="
          mt-8 sm:mt-10 lg:mt-14
          grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
          gap-4 sm:gap-6 lg:gap-8
        "
      >
        {/* Card 1 */}
        <article className="border border-gray-200 rounded-xl bg-white p-5 sm:p-6 lg:p-8 text-center text-[#4D4D4D] shadow-[0_4px_4px_rgba(171,190,209,0.8)]">
          <img src="../b1.png" alt="" className="mx-auto w-12 sm:w-14 lg:w-16 h-auto" />
          <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-5 mb-3 sm:mb-4 leading-snug">
            Elderly Users with Alzheimer’s or Memory Challenges
          </h3>
          <p className="text-sm sm:text-base">
            They directly benefit from the app by training their memory in a gentle,
            engaging, and stress-free way.
          </p>
        </article>

        {/* Card 2 */}
        <article className="border border-gray-200 rounded-xl bg-white p-5 sm:p-6 lg:p-8 text-center text-[#4D4D4D] shadow-[0_4px_4px_rgba(171,190,209,0.8)]">
          <img src="../b2.png" alt="" className="mx-auto w-12 sm:w-14 lg:w-16 h-auto" />
          <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-5 mb-3 sm:mb-4 leading-snug">
            Family Members &amp; Caregivers
          </h3>
          <p className="text-sm sm:text-base">
            It gives them a tool to engage with their loved one, track progress,
            and encourage positive memory reinforcement.
          </p>
        </article>

        {/* Card 3 */}
        <article className="border border-gray-200 rounded-xl bg-white p-5 sm:p-6 lg:p-8 text-center text-[#4D4D4D] shadow-[0_4px_4px_rgba(171,190,209,0.8)]">
          <img src="../b3.png" alt="" className="mx-auto w-12 sm:w-14 lg:w-16 h-auto" />
          <h3 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-5 mb-3 sm:mb-4 leading-snug">
            Community &amp; Healthcare Support Groups
          </h3>
          <p className="text-sm sm:text-base">
            It creates a shared resource that strengthens community involvement in
            elderly care.
          </p>
        </article>
      </div>
    </section>
  );
};

export default Benefits;
