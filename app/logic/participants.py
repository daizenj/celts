from peewee import fn

from app.models.user import User
from app.models.event import Event
from app.models.program import Program
from app.models.programEvent import ProgramEvent
from app.models.eventParticipant import EventParticipant
from app.logic.users import isEligibleForProgram
from app.logic.volunteers import getEventLengthInHours

def trainedParticipants(programID):
    """
    This function tracks the users who have attended every Prerequisite
    event and adds them to a list that will not flag them when tracking hours.
    """
    trainingEvents = ProgramEvent.select().where(ProgramEvent.program == programID)
    trlist = [training.event for training in trainingEvents if training.event.isTraining]
    eventTrainingDataList = [participant.user.username for participant in (EventParticipant.select().where(EventParticipant.event.in_(trlist)))]
    attendedTraining = list(dict.fromkeys(filter(lambda user: eventTrainingDataList.count(user) == len(trlist), eventTrainingDataList)))
    return attendedTraining

def sendUserData(bnumber, eventid, programid):
    """Accepts scan input and signs in the user. If user exists or is already
    signed in will return user and login status"""
    signInUser = User.get(User.bnumber == bnumber)
    event = Event.get_by_id(eventid)
    if not isEligibleForProgram(programid, signInUser):
        userStatus = "banned"
    elif ((EventParticipant.select(EventParticipant.user)
                           .where(EventParticipant.attended, EventParticipant.user == signInUser, EventParticipant.event == eventid))
                           .exists()):
        userStatus = "already in"
    else:
        userStatus = "success"
        if EventParticipant.get_or_none(EventParticipant.user == signInUser, EventParticipant.event == eventid):
            (EventParticipant.update({EventParticipant.attended: True})
                             .where(EventParticipant.user == signInUser, EventParticipant.event == eventid)).execute()
        else:
            totalHours = getEventLengthInHours(event.timeStart, event.timeEnd,  event.startDate)
            EventParticipant.insert([{EventParticipant.user: signInUser,
                                      EventParticipant.event: eventid,
                                      EventParticipant.rsvp: False,
                                      EventParticipant.attended: True,
                                      EventParticipant.hoursEarned: totalHours}]).execute()
    return signInUser, userStatus

def userRsvpForEvent(user,  event):
    """
    Lets the user RSVP for an event if they are eligible and creates an entry for them in the EventParticipant table.

    :param user: accepts a User object or username
    :param event: accepts an Event object or a valid event ID
    :return: eventParticipant entry for the given user and event; otherwise raise an exception
    """

    rsvpUser = User.get_by_id(user)
    rsvpEvent = Event.get_by_id(event)
    program = Program.select(Program).join(ProgramEvent).where(ProgramEvent.event == event).get()

    isEligible = isEligibleForProgram(program, user)
    if isEligible:
        newParticipant = EventParticipant.get_or_create(user = rsvpUser, event = rsvpEvent, rsvp = True)[0]
        return newParticipant
    return isEligible



def unattendedRequiredEvents(program, user):

    # Check for events that are prerequisite for program
    requiredEvents = (Event.select(Event)
                           .join(ProgramEvent)
                           .where(Event.isTraining == True, ProgramEvent.program == program))

    if requiredEvents:
        attendedRequiredEventsList = []
        for event in requiredEvents:
            attendedRequirement = (EventParticipant.select().where(EventParticipant.attended == True, EventParticipant.user == user, EventParticipant.event == event))
            if not attendedRequirement:
                attendedRequiredEventsList.append(event.eventName)
        if attendedRequiredEventsList is not None:
            return attendedRequiredEventsList
    else:
        return []