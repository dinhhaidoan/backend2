# Locations (Base -> Floors -> Rooms)

This document outlines the endpoints for hierarchical loading of campuses (bases), floors, and rooms used by the frontend lesson creation UI.

Endpoints
- GET /api/share/bases
  - Returns: list of bases with fields: base_id, base_code, base_name
  - Example: [ { base_id: 1, base_code: 'L', base_name: 'Cơ sở L' }, ... ]

- GET /api/share/floors?base_id=1
  - Also available as: GET /api/share/bases/:base_code/floors (e.g., /api/share/bases/L/floors)
  - Parameters: base_id or base_code
  - Returns: list of floors of the base with fields: floor_id, base_id, floor_number, floor_name
  - Example: [ { floor_id: 2, base_id: 1, floor_number: 1, floor_name: 'L.T1' }, ... ]

- GET /api/share/rooms?base_id=1&floor_id=2
  - Also available as: GET /api/share/floors/:id/rooms (e.g., /api/share/floors/2/rooms)
  - Also available as: GET /api/share/bases/:base_code/floors/:floor_number/rooms (e.g., /api/share/bases/L/floors/1/rooms)
  - Parameters: base_id (or base_code), floor_id (or floor_number)
  - Returns: list of rooms of that floor with fields: room_id, base_id, floor_id, room_number, room_code, room_name
  - Example: [ { room_id: 3, room_code: 'L.101', room_name: 'L.101', ... }, ... ]

Notes
- The frontend should load only bases at initialization (small list), then when a user chooses a base, request floors for that base, then when a floor is chosen, request rooms for that floor.
- These read-only endpoints avoid loading all 200+ rooms at once.
- All endpoints are public (no auth required) because data is purely reference data.
