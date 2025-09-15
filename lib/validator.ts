// // Helper function to validate and fix flight offers for booking compatibility
// export function validateAndFixFlightOfferForBooking(flightOffer: any): any {
//   if (!flightOffer) {
//     throw new Error("Flight offer is required");
//   }

//   // Deep clone to avoid mutating original
//   const fixedOffer = JSON.parse(JSON.stringify(flightOffer));

//   // Remove any enrichment data that might interfere with booking
//   delete fixedOffer._enriched;
//   if (fixedOffer.itineraries) {
//     fixedOffer.itineraries.forEach((itinerary: any) => {
//       delete itinerary._enriched;
//       delete itinerary._formattedDuration;
//       if (itinerary.segments) {
//         itinerary.segments.forEach((segment: any) => {
//           delete segment._enriched;
//           delete segment._formattedDuration;
//           if (segment.departure) {
//             delete segment.departure._enriched;
//           }
//           if (segment.arrival) {
//             delete segment.arrival._enriched;
//           }
//         });
//       }
//     });
//   }

//   // Ensure mandatory fields exist
//   const errors: string[] = [];

//   // 1. Check and fix 'id'
//   if (!fixedOffer.id) {
//     fixedOffer.id = `generated-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`;
//   }

//   // 2. Check and fix 'source'
//   if (!fixedOffer.source) {
//     fixedOffer.source = "GDS";
//   }

//   // 3. Check and fix 'type'
//   if (!fixedOffer.type) {
//     fixedOffer.type = "flight-offer";
//   }

//   // 4. Check and fix 'validatingAirlineCodes'
//   if (
//     !fixedOffer.validatingAirlineCodes ||
//     !Array.isArray(fixedOffer.validatingAirlineCodes) ||
//     fixedOffer.validatingAirlineCodes.length === 0
//   ) {
//     // Try to extract from first segment
//     const firstCarrier =
//       fixedOffer.itineraries?.[0]?.segments?.[0]?.carrierCode;
//     fixedOffer.validatingAirlineCodes = firstCarrier ? [firstCarrier] : ["XX"];
//   }

//   // 5. Check and fix 'itineraries'
//   if (
//     !fixedOffer.itineraries ||
//     !Array.isArray(fixedOffer.itineraries) ||
//     fixedOffer.itineraries.length === 0
//   ) {
//     errors.push("Flight offer must have at least one itinerary");
//   } else {
//     // Validate itinerary structure
//     fixedOffer.itineraries.forEach((itinerary: any, itinIndex: number) => {
//       if (
//         !itinerary.segments ||
//         !Array.isArray(itinerary.segments) ||
//         itinerary.segments.length === 0
//       ) {
//         errors.push(`Itinerary ${itinIndex} must have at least one segment`);
//       } else {
//         // Ensure each segment has required fields
//         itinerary.segments.forEach((segment: any, segIndex: number) => {
//           // Ensure segment has ID
//           if (!segment.id) {
//             segment.id = `${itinIndex + 1}_${segIndex + 1}`;
//           }

//           // Ensure departure data
//           if (
//             !segment.departure ||
//             !segment.departure.iataCode ||
//             !segment.departure.at
//           ) {
//             errors.push(
//               `Segment ${segIndex} in itinerary ${itinIndex} missing departure data`
//             );
//           }

//           // Ensure arrival data
//           if (
//             !segment.arrival ||
//             !segment.arrival.iataCode ||
//             !segment.arrival.at
//           ) {
//             errors.push(
//               `Segment ${segIndex} in itinerary ${itinIndex} missing arrival data`
//             );
//           }

//           // Ensure carrier info
//           if (!segment.carrierCode || !segment.number) {
//             errors.push(
//               `Segment ${segIndex} in itinerary ${itinIndex} missing carrier information`
//             );
//           }

//           // Ensure duration
//           if (!segment.duration) {
//             // Calculate duration if missing
//             if (segment.departure?.at && segment.arrival?.at) {
//               const depTime = new Date(segment.departure.at);
//               const arrTime = new Date(segment.arrival.at);
//               const diffMs = arrTime.getTime() - depTime.getTime();
//               const hours = Math.floor(diffMs / (1000 * 60 * 60));
//               const minutes = Math.floor(
//                 (diffMs % (1000 * 60 * 60)) / (1000 * 60)
//               );
//               segment.duration = `PT${hours}H${minutes}M`;
//             } else {
//               segment.duration = "PT0H0M";
//             }
//           }

//           // Ensure numberOfStops exists
//           if (segment.numberOfStops === undefined) {
//             segment.numberOfStops = 0;
//           }
//         });
//       }
//     });
//   }

//   // 6. Check and fix 'travelerPricings'
//   if (
//     !fixedOffer.travelerPricings ||
//     !Array.isArray(fixedOffer.travelerPricings) ||
//     fixedOffer.travelerPricings.length === 0
//   ) {
//     // Create basic traveler pricing
//     fixedOffer.travelerPricings = [
//       {
//         travelerId: "1",
//         fareOption: "STANDARD",
//         travelerType: "ADULT",
//         price: {
//           currency: fixedOffer.price?.currency || "USD",
//           total: fixedOffer.price?.total || "0",
//           base: fixedOffer.price?.base || fixedOffer.price?.total || "0",
//           taxes: fixedOffer.price?.taxes || [],
//         },
//         fareDetailsBySegment: [],
//       },
//     ];

//     // Create fare details for each segment
//     if (fixedOffer.itineraries) {
//       fixedOffer.itineraries.forEach((itinerary: any) => {
//         if (itinerary.segments) {
//           itinerary.segments.forEach((segment: any) => {
//             fixedOffer.travelerPricings[0].fareDetailsBySegment.push({
//               segmentId: segment.id,
//               cabin: "ECONOMY",
//               fareBasis: "ECONOMY",
//               class: "Y",
//               includedCheckedBags: {
//                 quantity: 0,
//                 weight: 0,
//                 weightUnit: "KG",
//               },
//             });
//           });
//         }
//       });
//     }
//   }

//   // 7. Ensure price structure is complete
//   if (!fixedOffer.price) {
//     fixedOffer.price = {
//       currency: "USD",
//       total: "0",
//       base: "0",
//       fees: [],
//       grandTotal: "0",
//     };
//   } else {
//     // Ensure required price fields
//     fixedOffer.price.currency = fixedOffer.price.currency || "USD";
//     fixedOffer.price.total = fixedOffer.price.total || "0";
//     fixedOffer.price.base =
//       fixedOffer.price.base || fixedOffer.price.total || "0";
//     fixedOffer.price.fees = fixedOffer.price.fees || [];
//     fixedOffer.price.grandTotal =
//       fixedOffer.price.grandTotal || fixedOffer.price.total || "0";
//   }

//   // 8. Ensure other required fields
//   fixedOffer.nonHomogeneous =
//     fixedOffer.nonHomogeneous !== undefined ? fixedOffer.nonHomogeneous : false;
//   fixedOffer.oneWay =
//     fixedOffer.oneWay !== undefined ? fixedOffer.oneWay : true;
//   fixedOffer.numberOfBookableSeats = fixedOffer.numberOfBookableSeats || 9;

//   // Set lastTicketingDate if missing (7 days from now)
//   if (!fixedOffer.lastTicketingDate) {
//     const futureDate = new Date();
//     futureDate.setDate(futureDate.getDate() + 7);
//     fixedOffer.lastTicketingDate = futureDate.toISOString().split("T")[0];
//   }

//   // Ensure pricingOptions exists
//   if (!fixedOffer.pricingOptions) {
//     fixedOffer.pricingOptions = {
//       fareType: ["PUBLISHED"],
//       includedCheckedBagsOnly: false,
//     };
//   }

//   // If there are validation errors, throw them
//   if (errors.length > 0) {
//     throw new Error(`Flight offer validation failed: ${errors.join(", ")}`);
//   }

//   return fixedOffer;
// }

// // Function to validate flight offer before booking
// export function validateFlightOfferForBooking(flightOffer: any): {
//   isValid: boolean;
//   errors: string[];
//   fixed?: any;
// } {
//   try {
//     const fixedOffer = validateAndFixFlightOfferForBooking(flightOffer);
//     return {
//       isValid: true,
//       errors: [],
//       fixed: fixedOffer,
//     };
//   } catch (error: any) {
//     return {
//       isValid: false,
//       errors: [error.message],
//     };
//   }
// }
