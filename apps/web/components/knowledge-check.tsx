"use client";

import type { LessonQuestion } from "@sismo/aula-content";
import { useEffect, useState } from "react";

const PROGRESS_KEY = "aula-progress";

export function readProgress(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function KnowledgeCheck({
  lessonSlug,
  question,
}: {
  lessonSlug: string;
  question: LessonQuestion;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(Boolean(readProgress()[lessonSlug]));
  }, [lessonSlug]);

  const isCorrect = selected === question.correctOptionId;

  return (
    <div
      className="rounded-lg border border-gray-200 p-4"
      data-testid="knowledge-check"
    >
      <h3 className="font-semibold">{question.prompt}</h3>
      <fieldset className="mt-3 space-y-2">
        <legend className="sr-only">{question.prompt}</legend>
        {question.options.map((option) => (
          <label key={option.id} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`question-${lessonSlug}`}
              value={option.id}
              checked={selected === option.id}
              onChange={() => {
                setSelected(option.id);
                setChecked(false);
              }}
            />
            {option.text}
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        disabled={selected === null}
        onClick={() => setChecked(true)}
        className="mt-3 rounded bg-official px-3 py-1.5 text-sm font-medium text-background-100 hover:bg-gray-900 disabled:opacity-50"
        data-testid="check-answer"
      >
        Comprobar
      </button>
      {checked ? (
        <p
          role="status"
          className={`mt-3 rounded p-2 text-sm ${
            isCorrect
              ? "bg-official-soft text-official"
              : "bg-explanation-soft text-explanation"
          }`}
          data-testid="answer-feedback"
        >
          {isCorrect ? question.feedbackCorrect : question.feedbackIncorrect}
        </p>
      ) : null}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const progress = readProgress();
            progress[lessonSlug] = true;
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
            setCompleted(true);
          }}
          className="rounded border border-official px-3 py-1.5 text-sm font-medium text-official hover:bg-official-soft"
          data-testid="complete-lesson"
        >
          Marcar lección como completada
        </button>
        <span
          role="status"
          aria-live="polite"
          className="text-sm text-gray-600"
        >
          {completed ? "Lección completada (guardado en este navegador)" : ""}
        </span>
      </div>
    </div>
  );
}

export function AulaProgress({ totalLessons }: { totalLessons: number }) {
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  useEffect(() => {
    setCompletedCount(Object.values(readProgress()).filter(Boolean).length);
  }, []);
  return (
    <p className="text-sm text-gray-600" data-testid="aula-progress">
      Progreso local: {completedCount ?? 0}/{totalLessons} lecciones. Se guarda
      solo en este navegador, sin cuentas.
    </p>
  );
}
