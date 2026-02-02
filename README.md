# NexusFons System

Authentication System: Firebase <br>
Database: Postgresql

In login, the request with the user details never enters NexusFons server *first*. It enters Firebase server, firebase checks if user exists and if user does exist, firebase returns an authentication id (authId) that embeds the actual userId, this authId becomes the raw material for the NexusFons Identity System, which is, the Identity & Authority Subsystem.

## Identity & Authority Subsystem
This subsystem handles verifying user authorization to the both the system at large and resources within the system. It has veto-power!

<b>Required Input</b>
- authId from authentication system used.


## File Structure
Each subsystem has these four folders namely:
- api
- application
- domain
- infrastructure

<b>Domain:</b>
Everything begins with the domain. It houses only and just business rules. This is the space where business rules are written as code. _If the domain doesn't permit it, it must not be present in the system._

<b>Application:</b>
The application layer specifically models all use cases of that subsystem using domain entities. There is no implentation here, just modelling use cases usnig domain entities. <br><br> For instance, the Identity & Authorization Subsystem handles authentication and authorization of users within the system. The application of the I&A subsystem would contain use cases such as authenticate users (AuthenticateUsers.ts) and authoriza users (AuthorizeUsers.ts). <br><br> In this layer, we build _<b>ports</b>_ the next layer will plug into.

<b>Infrastructure:</b>
This layer handles all technical implementation. _<b>Adapters</b>_ that plug into the _<b>ports</b>_ are built here.