/* Copyright 2026 Tutorializer LLC */

import { createFileRoute } from '@tanstack/react-router'

import CreateAndCompleteTaskTutorial from '../../tutorials/CreateAndCompleteTaskTutorial.jsx'

export const Route = createFileRoute('/tutorials/create-and-complete-task')({
  component: CreateAndCompleteTaskTutorial,
  ssr: false,
})
