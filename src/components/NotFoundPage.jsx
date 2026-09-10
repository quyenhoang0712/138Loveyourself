import './NotFoundPage.css'

const notFoundArtwork = 'https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets/system/not-found-404-4bRuOsGDYjWX8iLOM0ZxWb8VdARKWs.svg'
const bicycleArtwork = 'https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets/system/not-found-illustration-7MXtPFZC9UH19MOMlcZBiAEnnZ4ZIF.svg'

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <section className="not-found-panel" aria-labelledby="not-found-title">
        <h1 className="not-found-title" id="not-found-title">
          Trang không tìm thấy
        </h1>

        <img
          className="not-found-illustration"
          src={bicycleArtwork}
          alt="Nhân vật trái tim đang đạp xe"
        />
        <img
          className="not-found-message"
          src={notFoundArtwork}
          alt="Oops! Lỗi 404. Trang hiện đang tải, bạn đợi tí nhé..."
        />
      </section>
    </main>
  )
}
