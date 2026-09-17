/* Copyright 2026 Tutorializer LLC */

import { initTourRunner } from '@tutorializer/tours/TourRunner.js'

import tours from './tours.json'

export default function initializeTutorializer() {
  if (typeof window !== 'undefined') {
    initTourRunner(tours)
  }
}
