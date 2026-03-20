// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// --- THE SCHEDULING ALGORITHM ---
function assignSchedules(patients: any, caregivers: any, previousAssignments: any) {
    let assignments: any = {};
    let unfilledShifts: any = {};
    let caregiverHours: any = {};
    const MIN_SHIFT_HOURS = 4;

    for (let p in patients) assignments[p] = {};
    for (let c in caregivers) caregiverHours[c] = 0;

    for (let patient in patients) {
        let needs = patients[patient];
        let vipCaregiver = previousAssignments[patient];

        const isPerfectMatch = (cg: string) => {
            if (!cg || !caregivers[cg]) return false;
            for (let day in needs) {
                if ((caregivers[cg][day] || 0) < needs[day]) return false;
            }
            return true;
        };

        if (isPerfectMatch(vipCaregiver)) {
            for (let day in needs) {
                assignments[patient][day] = [{ caregiver: vipCaregiver, hours: needs[day] }];
                caregivers[vipCaregiver][day] -= needs[day];
                caregiverHours[vipCaregiver] += needs[day];
            }
            continue;
        }

        let perfectMatches = Object.keys(caregivers).filter(isPerfectMatch);
        if (perfectMatches.length > 0) {
            perfectMatches.sort((a, b) => caregiverHours[a] - caregiverHours[b]);
            let bestMatch = perfectMatches[0];
            
            for (let day in needs) {
                assignments[patient][day] = [{ caregiver: bestMatch, hours: needs[day] }];
                caregivers[bestMatch][day] -= needs[day];
                caregiverHours[bestMatch] += needs[day];
            }
            continue;
        }

        let generalPool = Object.keys(caregivers).filter(c => c !== vipCaregiver);
        generalPool.sort((a, b) => caregiverHours[a] - caregiverHours[b]);
        let fragmentedPool = vipCaregiver ? [vipCaregiver, ...generalPool] : generalPool;

        for (let day in needs) {
            let hoursNeeded = needs[day];
            assignments[patient][day] = [];

            for (let caregiver of fragmentedPool) {
                let available = caregivers[caregiver] && caregivers[caregiver][day] ? caregivers[caregiver][day] : 0;

                if (available >= MIN_SHIFT_HOURS && hoursNeeded > 0) {
                    let hoursToTake = Math.min(available, hoursNeeded);

                    if (hoursToTake >= MIN_SHIFT_HOURS || hoursToTake === hoursNeeded) {
                        assignments[patient][day].push({ caregiver, hours: hoursToTake });
                        caregivers[caregiver][day] -= hoursToTake;
                        hoursNeeded -= hoursToTake;
                        caregiverHours[caregiver] += hoursToTake;
                    }
                }
                if (hoursNeeded === 0) break;
            }

            if (hoursNeeded > 0) {
                if (!unfilledShifts[patient]) unfilledShifts[patient] = {};
                unfilledShifts[patient][day] = hoursNeeded;
            }
        }
    }

    return { assignments, caregiverHours, unfilledShifts };
}

// --- THE API LISTENER ---
// 1. Explicitly type the Request and use the 'Error' type for the catch block
Deno.serve(async (req: Request) => {
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { patients, caregivers, previousAssignments } = await req.json()

    const result = assignSchedules(patients, caregivers, previousAssignments)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error: unknown) {
    // 2. Handle the 'unknown' error type by narrowing it down
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})

// CORS Headers so local development works smoothly
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}