import { assetUrl } from '../utils/assets'

const homeHeroImageUrl = assetUrl('homepage/home-hero-art.gif')

export function IntroVideoSection() {
  return (
    <section className="intro-video-section">
      <div className="intro-video-frame scroll-pop">
        <img
          className="intro-video"
          src={homeHeroImageUrl}
          alt=""
          aria-hidden="true"
        />
      </div>
      <div className="room-choice-prompt scroll-pop">
        <div className="room-choice-prompt-inner">
          <h2>
            bạn ơi đừng chờ vội chi
            <span>dừng chân một chút ghé chơi cùng mình</span>
          </h2>
          <p>
            Đây là một không gian nhỏ được tạo để bạn có thể ghé vào bất cứ khi nào cần một chút nghỉ ngơi,
            tập trung hoặc đơn giản là tìm một cảm giác dễ chịu trong ngày. Bạn cứ thoải mái ở lại bao lâu tùy
            thích, rồi quay lại nhịp sống của mình khi đã thấy sẵn sàng nhé.
          </p>
        </div>
      </div>
    </section>
  )
}
