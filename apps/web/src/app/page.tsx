export default function HomePage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        🐾 ระบบจัดการสัตว์จรจัด
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        ระบบดิจิทัลสำหรับบริหารจัดการสัตว์จรจัดอย่างเป็นระบบ
        ตั้งแต่การลงทะเบียน ติดตามสุขภาพ ทำหมัน ฉีดวัคซีน
        ไปจนถึงการหาบ้านใหม่
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <FeatureCard
          emoji="📢"
          title="แจ้งเบาะแส"
          description="แจ้งพบสัตว์จรจัดหรือปัญหาภายใน 3 ขั้นตอน"
          href="/reports/new"
        />
        <FeatureCard
          emoji="🏠"
          title="รับเลี้ยง"
          description="ค้นหาสัตว์ที่เหมาะกับคุณ"
          href="/adoption"
        />
        <FeatureCard
          emoji="🗺️"
          title="แผนที่"
          description="ดูตำแหน่งสัตว์จรจัดและจุดให้อาหาร"
          href="/map"
        />
      </div>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
  href,
}: {
  emoji: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="text-4xl mb-3">{emoji}</div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </a>
  );
}
