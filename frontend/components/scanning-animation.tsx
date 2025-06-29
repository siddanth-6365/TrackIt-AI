"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Scan, Brain, Database, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScanningAnimationProps {
  imagePreview: string
  onComplete?: () => void
}

const scanningSteps = [
  { icon: Scan, label: "Scanning image...", duration: 2000 },
  { icon: Brain, label: "Extracting text...", duration: 2500 },
  { icon: Database, label: "Processing data...", duration: 2000 },
  { icon: CheckCircle, label: "Complete!", duration: 500 },
]

export function ScanningAnimation({ imagePreview, onComplete }: ScanningAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [scanLinePosition, setScanLinePosition] = useState(0)

  useEffect(() => {
    const totalDuration = scanningSteps.reduce((sum, step) => sum + step.duration, 0)
    let elapsed = 0

    const interval = setInterval(() => {
      elapsed += 50
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100)
      setProgress(newProgress)

      // Update scan line position
      setScanLinePosition(((elapsed % 3000) / 3000) * 100)

      // Update current step
      let stepElapsed = 0
      for (let i = 0; i < scanningSteps.length; i++) {
        stepElapsed += scanningSteps[i].duration
        if (elapsed <= stepElapsed) {
          setCurrentStep(i)
          break
        }
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval)
        setTimeout(() => onComplete?.(), 500)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [onComplete])

  const CurrentIcon = scanningSteps[currentStep]?.icon || Scan

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Image with scanning overlay */}
          <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-[4/3]">
            <img
              src={imagePreview || "/placeholder.svg"}
              alt="Receipt being scanned"
              className="w-full h-full object-contain"
            />

            {/* Scanning overlay */}
            <div className="absolute inset-0 bg-black/20">
              {/* Scanning line */}
              <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg transition-all duration-75 ease-linear"
                style={{ top: `${scanLinePosition}%` }}
              />

              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-30">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `
                    linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
                  `,
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Progress section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CurrentIcon className="w-5 h-5 text-emerald-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{scanningSteps[currentStep]?.label || "Processing..."}</p>
                <p className="text-sm text-gray-500">AI is analyzing your receipt</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Steps indicator */}
            <div className="flex justify-between">
              {scanningSteps.slice(0, -1).map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                      index <= currentStep ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500",
                    )}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={cn(
                      "text-xs transition-colors",
                      index <= currentStep ? "text-emerald-600" : "text-gray-400",
                    )}
                  >
                    {step.label.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
