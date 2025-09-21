import React from 'react'
import HeaderLanding from '../Component/LandingPage/HeaderLanding'
import StartNow from '../Component/LandingPage/StartNow'
import Benefits from '../Component/LandingPage/Benefits'

const LandingPage = () => {
  return (
  <>
    <div>
        <HeaderLanding />
    </div>

    <div>
        <StartNow />
    </div>
    <div>
      <Benefits />
    </div>
  </>

  )
}

export default LandingPage