import { Modal } from '@/modules/assessment/components/Modal'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'

// Migrated from openMethodologyModal() (js/assessment.js ~4220-4229) — static
// explanatory text, no state.
export function MethodologyModal({ onClose }: { onClose: () => void }) {
  const { ui } = useAssessment()
  return (
    <Modal
      title={ui.methodologyModalTitle}
      sub={ui.methodologyModalSub}
      onClose={onClose}
      footer={
        <button className="btn btn-primary" onClick={onClose}>
          {ui.methodologyGotIt}
        </button>
      }
    >
      {/* These strings carry literal <b> tags (legacy renders them via innerHTML). */}
      <div className="small-note" style={{ marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: ui.methodologyDataShown }} />
      <div className="small-note" style={{ marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: ui.methodologyModuleA }} />
      <div className="small-note" style={{ marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: ui.methodologyModuleB }} />
      <div className="small-note" style={{ marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: ui.methodologyOverall }} />
      <div className="small-note" dangerouslySetInnerHTML={{ __html: ui.methodologyStorage }} />
    </Modal>
  )
}
