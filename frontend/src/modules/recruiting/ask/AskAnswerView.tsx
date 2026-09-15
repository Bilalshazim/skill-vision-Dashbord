import type { AskAnswer, TextPart } from '@/modules/recruiting/lib/ask'

function Parts({ parts }: { parts: TextPart[] }) {
  return (
    <>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          <span key={i}>{part}</span>
        ) : (
          <b key={i} className="font-semibold text-foreground">
            {part.text}
          </b>
        ),
      )}
    </>
  )
}

// Renders the typed block model lib/ask.ts builds (see that file's header
// comment for why this is JSX blocks rather than the raw HTML strings
// legacy's _composeAnswer()/QS[].fn() return) — one block type per legacy
// visual element: .ans-title, a plain <p>, a <ul>, and the small ".src"
// trailer line.
export function AskAnswerView({ answer }: { answer: AskAnswer }) {
  return (
    <div className="flex flex-col gap-1.5">
      {answer.blocks.map((block, i) => {
        if (block.type === 'title')
          return (
            <div key={i} className="text-[13.5px] font-semibold text-foreground">
              <Parts parts={block.parts} />
            </div>
          )
        if (block.type === 'paragraph')
          return (
            <p key={i} className="text-[13px] leading-relaxed text-muted-foreground">
              <Parts parts={block.parts} />
            </p>
          )
        if (block.type === 'list')
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-muted-foreground">
              {block.items.map((item, j) => (
                <li key={j}>
                  <Parts parts={item} />
                </li>
              ))}
            </ul>
          )
        return (
          <div key={i} className="mt-1 text-[11px] text-muted-foreground/80">
            {block.text}
          </div>
        )
      })}
    </div>
  )
}
