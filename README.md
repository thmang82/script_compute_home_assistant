# Home Script 'Home Assistant'

This is a data source script for the WunderView home script worker.
- Category: 'compute'
- Ident:    'home_assistant'
- Provides: 'compute', 'device_lights', 'device_covers'

The script connects to a home assistant instance via the Websocket-API provided by home assistant.\
This enables to get all state changes and execute commands.\
For now, only Lights and Cover Entities are supported.\


