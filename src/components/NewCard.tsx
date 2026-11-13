import { useRef } from 'react'

import { CancelButton } from '~/components/CancelButton'
import { SaveButton } from '~/components/SaveButton'

import { itemSchema } from '../db/schema'
import { invariant } from '../invariant'
import { useCreateItemMutation } from '../queries'
import { ItemMutationFields } from '../types'

export function NewCard({
  columnId,
  boardId,
  nextOrder,
  onComplete,
}: {
  columnId: string
  boardId: string
  nextOrder: number
  onComplete: () => void
}) {
  const titleInputRef = useRef<HTMLInputElement>(null)
  const { mutate } = useCreateItemMutation()

  return (
    <form
      data-testid="new-card-form"
      method="post"
      className="px-2 py-1 border-t-2 border-b-2 border-transparent"
      onSubmit={event => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const id = crypto.randomUUID()
        formData.set(ItemMutationFields.id.name, id)

        invariant(titleInputRef.current)
        titleInputRef.current.value = ''

        mutate({
          data: itemSchema.parse(Object.fromEntries(formData.entries())),
        })
      }}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onComplete()
        }
      }}
    >
      <input type="hidden" name="boardId" value={boardId} />
      <input
        type="hidden"
        name={ItemMutationFields.columnId.name}
        value={columnId}
      />
      <input
        type="hidden"
        name={ItemMutationFields.order.name}
        value={nextOrder}
      />

      {/* Native single-line form submission lets the browser consume IME Enter. */}
      <input
        autoFocus
        required
        ref={titleInputRef}
        name={ItemMutationFields.title.name}
        placeholder="Enter a title for this card"
        className="outline-hidden shadow-sm text-sm rounded-lg w-full py-1 px-2 resize-none placeholder:text-sm placeholder:text-slate-500 h-14"
        onKeyDown={event => {
          if (event.key === 'Escape') onComplete()
        }}
      />
      <div className="flex justify-between">
        <SaveButton data-testid="save-card">Save Card</SaveButton>
        <CancelButton onClick={onComplete}>Cancel</CancelButton>
      </div>
    </form>
  )
}
