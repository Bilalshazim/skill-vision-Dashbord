import { Note } from '@/components/patterns/Note'
import { Button } from '@/components/ui/button'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'

// Migrated from openMethodologyModal() (js/assessment.js ~4220-4229) — static
// explanatory text, no state.
export function MethodologyModal({ onClose }: { onClose: () => void }) {
  const { ui } = useAssessment()
  return (
    <ModalDialog
      title={ui.methodologyModalTitle}
      sub={ui.methodologyModalSub}
      onClose={onClose}
      footer={
        <Button variant="default" onClick={onClose}>
          {ui.methodologyGotIt}
        </Button>
      }
    >
      {/* These strings carry literal <b> tags (legacy renders them via innerHTML). */}
      <Note as="div" className="mb-3" dangerouslySetInnerHTML={{ __html: ui.methodologyDataShown }} />
      <Note as="div" className="mb-3" dangerouslySetInnerHTML={{ __html: ui.methodologyModuleA }} />
      <Note as="div" className="mb-3" dangerouslySetInnerHTML={{ __html: ui.methodologyModuleB }} />
      <Note as="div" className="mb-3" dangerouslySetInnerHTML={{ __html: ui.methodologyOverall }} />
      <Note as="div" dangerouslySetInnerHTML={{ __html: ui.methodologyStorage }} />
    </ModalDialog>
  )
}
