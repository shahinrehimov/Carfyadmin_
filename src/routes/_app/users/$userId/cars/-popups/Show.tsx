import type { ReactNode } from "react";
import { Car, Calendar, Hash, Palette, Fuel, Gauge, Settings2 } from "lucide-react";
import { useUserCar } from "@/lib/queries/users";
import { useTranslation } from "@/lib/utils/translationLoader";

interface ShowProps {
  userId: number;
  carId: number;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-gray-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function Show({ userId, carId }: ShowProps) {
  const { t } = useTranslation();
  const { data: car, isLoading } = useUserCar(userId, carId);

  if (isLoading) {
    return (
      <div className="space-y-4 py-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-6 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!car) return null;

  return (
    <div className="space-y-4 py-2">
      {car.photo && (
        <div className="overflow-hidden rounded-lg border">
          <img src={car.photo} alt={car.brand_model?.title || t("car")} className="h-48 w-full object-cover" />
        </div>
      )}

      <DetailRow icon={<Car className="h-4 w-4" />} label={t("brand")} value={car.brand?.title} />
      <DetailRow icon={<Car className="h-4 w-4" />} label={t("brand_model")} value={car.brand_model?.title} />
      <DetailRow icon={<Calendar className="h-4 w-4" />} label={t("year")} value={car.year} />
      <DetailRow icon={<Palette className="h-4 w-4" />} label={t("car_color")} value={car.car_color?.title} />
      <DetailRow icon={<Settings2 className="h-4 w-4" />} label={t("car_type")} value={car.car_type?.title} />
      <DetailRow icon={<Fuel className="h-4 w-4" />} label={t("fuel_type")} value={car.fuel_type?.title} />
      <DetailRow
        icon={<Gauge className="h-4 w-4" />}
        label={t("transmission_type")}
        value={car.transmission_type?.title}
      />
      <DetailRow icon={<Gauge className="h-4 w-4" />} label={t("engine_volume")} value={car.engine_volume?.title} />
      <DetailRow icon={<Hash className="h-4 w-4" />} label={t("vin_number")} value={car.vin_number} />
      <DetailRow icon={<Hash className="h-4 w-4" />} label={t("engine_number")} value={car.engine_number} />
      <DetailRow icon={<Hash className="h-4 w-4" />} label={t("seat_count")} value={car.seat_count} />
      <DetailRow icon={<Calendar className="h-4 w-4" />} label={t("created_date")} value={car.created_date} />
    </div>
  );
}
