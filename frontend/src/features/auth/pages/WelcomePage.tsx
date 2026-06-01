import { useEffect, useState } from "react";

import { WelcomeView, type WelcomeSlide } from "../../../components/auth/WelcomeView";

const SLIDES: WelcomeSlide[] = [
  {
    url: "https://images.unsplash.com/photo-1763586756635-1c1b61f969d2?w=1920&q=85",
    alt: "Golden retriever sits by a calm lake",
    caption: "Mỗi thú cưng đều xứng đáng được yêu thương tốt nhất",
  },
  {
    url: "https://images.unsplash.com/photo-1743776351114-519247692199?w=1920&q=85",
    alt: "A curious tabby cat stares right at the camera",
    caption: "Đặt lịch khám dễ dàng - chăm sóc toàn diện",
  },
  {
    url: "https://images.unsplash.com/photo-1768084368558-0c4f68278309?w=1920&q=85",
    alt: "A golden retriever dog running through a field",
    caption: "Theo dõi sức khỏe thú cưng mọi lúc, mọi nơi",
  },
  {
    url: "https://images.unsplash.com/photo-1761079329550-8d91baffde00?w=1920&q=85",
    alt: "Fluffy grey cat with yellow eyes",
    caption: "Đội ngũ bác sĩ chuyên nghiệp - tận tâm với từng bệnh nhân",
  },
];

export type UserRole = "admin" | "doctor" | "staff" | "customer";

export function WelcomePage({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((current) => (current + 1) % SLIDES.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <WelcomeView
      slides={SLIDES}
      slide={slide}
      onSlideChange={setSlide}
      onLogin={onLogin}
      onRegister={onRegister}
    />
  );
}
