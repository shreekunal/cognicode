import React, { useEffect, useState } from "react";
import { FiClock, FiRefreshCw } from "react-icons/fi";

const DEFAULT_COUNTDOWN_SECONDS = 60 * 60;

const Timer = ({ superAlarmEnabled = false }) => {
  const [showTimer, setShowTimer] = useState(false);
  const [time, setTime] = useState(DEFAULT_COUNTDOWN_SECONDS);
  const [warningPlayed, setWarningPlayed] = useState(false);
  const [endPlayed, setEndPlayed] = useState(false);

  const playTone = (frequency) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.08;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close?.();
      }, 220);
    } catch (error) {
      // Ignore autoplay/audio-context failures.
    }
  };

  // Format timer into : hh:mm:ss format
  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;

    return `${hours > 0 ? hours + ":" : ""}${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  useEffect(() => {
    let intervalId;
    if (showTimer) {
      intervalId = setInterval(() => {
        setTime((currentTime) => Math.max(0, currentTime - 1));
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [showTimer]);

  useEffect(() => {
    if (!showTimer) return;

    if (superAlarmEnabled && time === 10 * 60 && !warningPlayed) {
      playTone(880);
      setWarningPlayed(true);
    }

    if (superAlarmEnabled && time === 0 && !endPlayed) {
      playTone(440);
      setEndPlayed(true);
      setShowTimer(false);
    }
  }, [showTimer, superAlarmEnabled, time, warningPlayed, endPlayed]);

  const resetTimer = () => {
    setShowTimer(false);
    setTime(DEFAULT_COUNTDOWN_SECONDS);
    setWarningPlayed(false);
    setEndPlayed(false);
  };

  return (
    <div className="flex items-center">
      {showTimer ? (
        <div
          className="flex items-center gap-1.5 rounded-md cursor-pointer hover:bg-light-3 dark:hover:bg-dark-4 p-1 transition-colors group"
          onClick={resetTimer}
          title="Reset Timer"
        >
          <div className="text-[11px] font-mono text-dark-4 dark:text-light-4 leading-none">{formatTime(time)}</div>
          <FiRefreshCw size={14} className="text-dark-4 dark:text-light-4 group-hover:rotate-180 transition-transform duration-500" />
        </div>
      ) : (
        <button
          className="flex items-center justify-center rounded-md cursor-pointer hover:bg-light-3 dark:hover:bg-dark-4 p-1 transition-colors"
          onClick={() => {
            setTime(DEFAULT_COUNTDOWN_SECONDS);
            setWarningPlayed(false);
            setEndPlayed(false);
            setShowTimer(true);
          }}
          title="Start Countdown"
        >
          <FiClock size={16} className="text-dark-4 dark:text-light-4" />
        </button>
      )}
    </div>
  );
};

export default Timer;
