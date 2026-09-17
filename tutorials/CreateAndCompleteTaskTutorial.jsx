/* Copyright 2026 Tutorializer LLC */

import Chapter from '@tutorializer/react/Chapter.jsx'
import PreloadedPage from '@tutorializer/react/PreloadedPage.jsx'
import { usePreloadedPageRefForCurrentChapter } from '@tutorializer/react/PreloadedPageContext.js'
import TourWithSpeech from '@tutorializer/react/TourWithSpeech.jsx'
import Tutorial from '@tutorializer/react/Tutorial.jsx'
import Tutorializer from '@tutorializer/react/Tutorializer.jsx'

const readPlaybackSpeed = () => {
  const speed = Number(new URLSearchParams(window.location.search).get('speed'))
  return Number.isFinite(speed) && speed > 0 ? speed : 1
}

const CreateAndCompleteTaskChapter = () => {
  const preloadedAppRef = usePreloadedPageRefForCurrentChapter()

  return (
    <Chapter name="Create and complete a task" animation="none">
      <PreloadedPage url="/" title="Trellaux" />
      <TourWithSpeech
        preloadedAppRef={preloadedAppRef}
        name="create-and-complete-task"
        speeches={false}
        speed={readPlaybackSpeed()}
        entrance={false}
      />
    </Chapter>
  )
}

export default function CreateAndCompleteTaskTutorial() {
  return (
    <Tutorializer>
      <Tutorial language="en">
        <CreateAndCompleteTaskChapter />
      </Tutorial>
    </Tutorializer>
  )
}
