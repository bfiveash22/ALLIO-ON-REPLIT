   table_name   |   column_name    |          data_type          
----------------+------------------+-----------------------------
 Conversation   | id               | text
 Conversation   | userId           | text
 Conversation   | peptideId        | text
 Conversation   | createdAt        | timestamp without time zone
 Conversation   | updatedAt        | timestamp without time zone
 IMConversation | id               | text
 IMConversation | userId           | text
 IMConversation | imTherapyId      | text
 IMConversation | createdAt        | timestamp without time zone
 IMConversation | updatedAt        | timestamp without time zone
 IMMessage      | id               | text
 IMMessage      | imConversationId | text
 IMMessage      | role             | text
 IMMessage      | content          | text
 IMMessage      | createdAt        | timestamp without time zone
 IMTherapy      | id               | text
 IMTherapy      | name             | text
 IMTherapy      | category         | text
 IMTherapy      | description      | text
 IMTherapy      | benefits         | ARRAY
 IMTherapy      | dosageRange      | text
 IMTherapy      | reconstitution   | text
 IMTherapy      | injectionSite    | text
 IMTherapy      | injectionVolume  | text
 IMTherapy      | frequency        | text
 IMTherapy      | phases           | text
 IMTherapy      | monitoring       | text
 IMTherapy      | precautions      | text
 IMTherapy      | storage          | text
 IMTherapy      | notes            | text
 IMTherapy      | personaTrait     | text
 IMTherapy      | createdAt        | timestamp without time zone
 IVConversation | id               | text
 IVConversation | userId           | text
 IVConversation | ivTherapyId      | text
 IVConversation | createdAt        | timestamp without time zone
 IVConversation | updatedAt        | timestamp without time zone
 IVMessage      | id               | text
 IVMessage      | ivConversationId | text
 IVMessage      | role             | text
 IVMessage      | content          | text
 IVMessage      | createdAt        | timestamp without time zone
 IVTherapy      | id               | text
 IVTherapy      | name             | text
 IVTherapy      | category         | text
 IVTherapy      | description      | text
 IVTherapy      | benefits         | ARRAY
 IVTherapy      | dosageRange      | text
 IVTherapy      | dilution         | text
 IVTherapy      | infusionTime     | text
 IVTherapy      | frequency        | text
 IVTherapy      | phases           | text
 IVTherapy      | monitoring       | text
 IVTherapy      | precautions      | text
 IVTherapy      | adjuncts         | text
 IVTherapy      | notes            | text
 IVTherapy      | personaTrait     | text
 IVTherapy      | createdAt        | timestamp without time zone
 Message        | id               | text
 Message        | conversationId   | text
 Message        | role             | text
 Message        | content          | text
 Message        | createdAt        | timestamp without time zone
 Peptide        | id               | text
 Peptide        | name             | text
 Peptide        | discoveryYear    | text
 Peptide        | era              | text
 Peptide        | description      | text
 Peptide        | therapeuticUses  | ARRAY
 Peptide        | dosageInfo       | text
 Peptide        | personaTrait     | text
 Peptide        | imageUrl         | text
 Peptide        | createdAt        | timestamp without time zone
 User           | id               | text
 User           | email            | text
 User           | name             | text
 User           | password         | text
 User           | createdAt        | timestamp without time zone
 User           | updatedAt        | timestamp without time zone
 User           | isAdmin          | boolean
 User           | resetToken       | text
 User           | resetTokenExpiry | timestamp without time zone
(82 rows)

