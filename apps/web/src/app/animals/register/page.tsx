import { RegisterAnimalForm } from '../../../features/animals/register-form';

export default function RegisterAnimalPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">📝 ลงทะเบียนสัตว์จรจัด</h1>
      <p className="text-gray-600 mb-6">
        บันทึกข้อมูลสัตว์จรจัดที่พบ เพื่อเพิ่มเข้าฐานข้อมูลกลาง
      </p>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <RegisterAnimalForm />
      </div>
    </div>
  );
}
