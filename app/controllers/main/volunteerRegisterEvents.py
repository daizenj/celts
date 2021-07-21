from app.models.event import Event
from app.models.user import User
from app.controllers.admin import admin_bp
from app.controllers.events import events_bp
from app.logic.userRsvpForEvent import userRsvpForEvent
from flask import flash, redirect, url_for, g




@events_bp.route('/rsvpForEvent', methods=['POST'])
def volunteerRegister(eventData):
    """
    This function selects the user ID and event ID and registers the user
    for the event they have clicked register for.
    """
    print(eventData)
    userId = User.get(User.username == g.current_user)
    print("hello")
    # eventData = request.form.copy()
    eventId = eventData['eventId']

    if userRsvpForEvent(userId, eventId):
        flash("Successfully registered for event!")
        print(url_for('events.showUpcomingEvent'))
        return redirect("https://www.google.com")

    else:
        return False
