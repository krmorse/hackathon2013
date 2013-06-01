Feature completness app

Value proposition:
 - Provide insights at any given point of time of the feature completeness that belong to a given ART/PSI/Release
 - Facilitates decisions of what changes might be necessary to successfully deliver the PSI

What does the app do?
 - For a given release, provide a list of ranked features
 - Automatically compiled from number of stories completed/stories remaining 
 

Data

- List of features for a given release
- At any given point of time each feature has
   - Start Date
   - End Date
   - Plan completion = 
      - nbDaySpent = number of day elapse since the the begining of the feature
      - planStoryPerDay = expected number of story points being completed for a given day for this feature
      formula = nbDaySpent * planStoryPerDay
    - Actualy completion = 
        - number of story point being delivered for this feature to date
      
 