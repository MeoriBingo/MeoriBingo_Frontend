import { useNavigate } from 'react-router-dom'
import PhotoUploadModal from '../components/PhotoUploadModal'

function PhotoUploadPreviewPage() {
  const navigate = useNavigate()

  const mockCell = {
    id: 1,
    mission_title: '샘플 미션',
  }

  return (
    <PhotoUploadModal
      cell={mockCell}
      onClose={() => navigate('/main')}
      onVerifySuccess={() => {}}
    />
  )
}

export default PhotoUploadPreviewPage
