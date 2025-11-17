# Master Tour Integration

This document describes the integration with Master Tour (Eventric) for event advancing and tour management.

## Overview

Master Tour is a tour management platform that handles event advancing, itinerary management, guest lists, and set lists. This application integrates with the Master Tour API to:

1. Display event status and advancing progress
2. Sync event data from Master Tour
3. Generate AI-powered advancing drafts (future feature)
4. Track advancing items and their completion status

## API Documentation

- **API Docs**: https://my.eventric.com/portal/apidocs
- **Support**: https://support.eventric.com/hc/en-us/articles/360060671272-Advancing-Events
- **API Version**: v5

## Authentication

Master Tour uses OAuth 1.0 authentication with public/private keypairs.

### Getting API Keys

1. Log into Master Tour at https://my.eventric.com
2. Navigate to your account settings
3. Generate API keys or use the `/api/v5/getkeys` endpoint with your username/password

### Security Notes

⚠️ **IMPORTANT**: OAuth 1.0 signature generation requires your private key. In production:

1. **Never** expose your private key in client-side code
2. **Always** proxy Master Tour API calls through a backend service
3. The backend should handle OAuth signature generation securely
4. Only pass the signed requests to the client

The current implementation is a client-side prototype. For production use, implement a backend proxy.

## Configuration

Add the following environment variables to your `.env` file:

```env
VITE_MASTER_TOUR_API_URL=https://my.eventric.com
VITE_MASTER_TOUR_PUBLIC_KEY=your-public-key
VITE_MASTER_TOUR_PRIVATE_KEY=your-private-key
```

## Available Endpoints

### Tours

```typescript
// Get all tours
const tours = await masterTourApi.getTours();

// Get specific tour
const tour = await masterTourApi.getTour(tourId);

// Get tour crew
const crew = await masterTourApi.getTourCrew(tourId);
```

### Events

```typescript
// Get events for a day
const events = await masterTourApi.getDayEvents(dayId);

// Get guest list for event
const guestList = await masterTourApi.getEventGuestList(eventId);

// Get set list for event
const setList = await masterTourApi.getEventSetList(eventId);
```

## Data Flow

### Advancing Workflow

1. **Tour Manager** creates an advance template in Master Tour
2. **Master Tour** stores the template with advancing items
3. **This App** syncs event data via API
4. **This App** displays event status and advancing progress
5. **This App** generates AI drafts for advancing communications (future)
6. **Master Tour** remains the source of truth for all advancing data

### Event Status Display

The Shows page displays events in two modes:

1. **Grid View**: Card-based layout showing event status summaries
2. **List View**: Table-based layout with detailed information

Clicking an event opens the detailed view with:
- Complete advancing checklist
- Progress tracking by category
- Guest list information
- Set list details
- Timeline of changes

## Components

### EventStatusCard

Displays a single event's status in a card format.

```typescript
import { EventStatusCard } from '@/components/EventStatusCard';

<EventStatusCard
  event={event}
  statusSummary={summary}
  onClick={() => navigate(`/shows/${event.id}`)}
/>
```

### EventStatusList

Displays a list of events from Master Tour.

```typescript
import { EventStatusList } from '@/components/EventStatusList';

<EventStatusList
  tourId={tourId}
  dayId={dayId}
  onEventClick={handleEventClick}
/>
```

## Type Definitions

See `src/types/masterTour.ts` for complete type definitions:

- `Event`: Event data structure
- `Tour`: Tour information
- `AdvanceItem`: Individual advancing checklist item
- `GuestListEntry`: Guest list entry
- `SetListEntry`: Set list song entry
- `EventStatusSummary`: Aggregated status information

## Future Enhancements

### Phase 1 (Current)
- ✅ Display event status from Master Tour
- ✅ Show advancing progress
- ✅ Basic event detail view

### Phase 2 (Planned)
- [ ] Real OAuth 1.0 implementation via backend proxy
- [ ] Two-way sync with Master Tour
- [ ] Real-time updates via webhooks
- [ ] Guest list management
- [ ] Set list editing

### Phase 3 (Future)
- [ ] AI-generated advancing drafts
- [ ] Automated status updates
- [ ] Smart templates based on venue type
- [ ] Integration with communication tools (email, SMS)
- [ ] Analytics and reporting

## Troubleshooting

### Authentication Errors

If you receive 401/403 errors:
1. Verify your API keys are correct
2. Check that your account has API access enabled
3. Ensure OAuth signature is being generated correctly

### Missing Data

If events aren't showing:
1. Verify you have tours set up in Master Tour
2. Check that events are created for those tours
3. Confirm your account has access to the tours

### CORS Errors

If you encounter CORS errors:
1. Master Tour API requires server-side authentication
2. Implement a backend proxy to handle API calls
3. Configure proper CORS headers on your backend

## Support

For Master Tour API issues:
- Email: support@eventric.com
- Documentation: https://support.eventric.com

For this integration:
- Check the GitHub repository issues
- Contact the development team
