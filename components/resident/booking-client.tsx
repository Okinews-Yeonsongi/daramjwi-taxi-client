"use client";
import { TripBookingFlow, type TripPayload } from "@/components/resident/trip-booking-flow";
import { createReservationAction } from "@/app/actions/reservations";

interface Props {
  villageId: string;
  residentId: string;
  dates: string[];
  usageMap: Record<string, number>;
}

export function BookingClient({ villageId, residentId, dates, usageMap }: Props) {
  return (
    <TripBookingFlow
      dates={dates}
      usageMap={usageMap}
      submitLabel="신청하기"
      onConfirm={(p: TripPayload) =>
        createReservationAction({
          ...p,
          village_id: villageId,
          resident_id: residentId,
          booked_by: "resident",
          created_by: null,
          is_phone_intake: false,
        })
      }
    />
  );
}
