'use client';

import { useState } from 'react';

const tabs = [
  { id: 'feeder', label: '🍖 จุดให้อาหาร', desc: 'ลงทะเบียนและ check-in จุดให้อาหาร' },
  { id: 'volunteer', label: '🙋 อาสาสมัคร', desc: 'ลงทะเบียนและรับงาน' },
  { id: 'foster', label: '🏡 Foster', desc: 'รับดูแลสัตว์ชั่วคราว' },
  { id: 'donate', label: '💝 บริจาค', desc: 'บริจาคเงินหรือ sponsor สัตว์' },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('feeder');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">🤝 ชุมชนและอาสาสมัคร</h1>
      <p className="text-gray-600 mb-6">มีส่วนร่วมในการดูแลสัตว์จรจัดในชุมชนของคุณ</p>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition
              ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'feeder' && <FeederTab />}
        {activeTab === 'volunteer' && <VolunteerTab />}
        {activeTab === 'foster' && <FosterTab />}
        {activeTab === 'donate' && <DonateTab />}
      </div>
    </div>
  );
}

function FeederTab() {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-3">🍖 จุดให้อาหาร</h2>
      <p className="text-sm text-gray-600 mb-4">ลงทะเบียนจุดที่คุณให้อาหารสัตว์จรจัดเป็นประจำ แล้ว check-in ทุกครั้งที่มาให้อาหาร (+5 คะแนน)</p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">ลงทะเบียนจุดใหม่</h3>
          <div className="space-y-3">
            <input type="text" placeholder="ช่วงเวลาให้อาหาร (เช่น เช้า 07:00)" className="w-full rounded-md border-gray-300 text-sm" />
            <input type="number" placeholder="จำนวนสัตว์โดยประมาณ" className="w-full rounded-md border-gray-300 text-sm" />
            <button className="w-full bg-orange-600 text-white py-2 rounded-md text-sm font-medium hover:bg-orange-700">📍 ลงทะเบียนจุดให้อาหาร</button>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">จุดของฉัน</h3>
          <div className="text-sm text-gray-500 text-center py-4">ยังไม่มีจุดให้อาหารที่ลงทะเบียน</div>
        </div>
      </div>
    </div>
  );
}

function VolunteerTab() {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-3">🙋 อาสาสมัคร</h2>
      <p className="text-sm text-gray-600 mb-4">ลงทะเบียนทักษะของคุณ แล้วรับงานที่เหมาะสม สะสมชั่วโมงเพื่อรับ badge</p>
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="text-center border rounded-lg p-3">
          <div className="text-2xl">🥉</div>
          <div className="text-xs mt-1">Starter (10 ชม.)</div>
        </div>
        <div className="text-center border rounded-lg p-3">
          <div className="text-2xl">🥈</div>
          <div className="text-xs mt-1">Active (50 ชม.)</div>
        </div>
        <div className="text-center border rounded-lg p-3">
          <div className="text-2xl">🥇</div>
          <div className="text-xs mt-1">Hero (200 ชม.)</div>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ทักษะ</label>
          <div className="flex gap-2 flex-wrap">
            {['ขับรถ', 'จับสัตว์', 'ปฐมพยาบาล', 'Foster', 'ถ่ายรูป'].map((s) => (
              <label key={s} className="flex items-center gap-1 text-sm">
                <input type="checkbox" className="rounded border-gray-300 text-orange-600" /> {s}
              </label>
            ))}
          </div>
        </div>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700">ลงทะเบียนอาสาสมัคร</button>
      </div>
    </div>
  );
}

function FosterTab() {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-3">🏡 Foster — รับดูแลชั่วคราว</h2>
      <p className="text-sm text-gray-600 mb-4">รับดูแลสัตว์จรจัดในบ้านของคุณระหว่างรอ adoption ช่วยให้สัตว์มีโอกาสหาบ้านถาวรมากขึ้น</p>
      <a href="/adoption" className="inline-block bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700">ดูสัตว์ที่รอ foster →</a>
    </div>
  );
}

function DonateTab() {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-3">💝 บริจาคและ Sponsor</h2>
      <p className="text-sm text-gray-600 mb-4">สนับสนุนค่าอาหาร ค่ารักษา และการดูแลสัตว์จรจัด</p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-medium">บริจาคทั่วไป</h3>
          <p className="text-xs text-gray-500 mt-1">สนับสนุนค่าใช้จ่ายรวม</p>
          <button className="mt-3 bg-orange-600 text-white px-4 py-1.5 rounded text-sm hover:bg-orange-700">บริจาค</button>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">🐾</div>
          <h3 className="font-medium">Sponsor สัตว์</h3>
          <p className="text-xs text-gray-500 mt-1">ดูแลสัตว์ตัวใดตัวหนึ่งเป็นพิเศษ</p>
          <button className="mt-3 bg-orange-600 text-white px-4 py-1.5 rounded text-sm hover:bg-orange-700">เลือก Sponsor</button>
        </div>
      </div>
    </div>
  );
}
