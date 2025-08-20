# GitHub Issues Setup for Tennis Club App

## Labels to Create

### Priority Labels
- `priority: high` - #d73a4a (red) - Critical for MVP
- `priority: medium` - #fbca04 (yellow) - Important but not blocking
- `priority: low` - #0075ca (blue) - Nice to have

### Category Labels
- `simplification` - #ff6b6b (coral) - Removing complexity
- `wireframes` - #4ecdc4 (teal) - Wireframe updates
- `flows` - #45b7d1 (blue) - User flow updates
- `documentation` - #96ceb4 (sage) - Documentation tasks
- `database` - #ffeaa7 (light yellow) - Schema changes
- `legal` - #a29bfe (lavender) - Privacy policy, terms, etc.

### Status Labels
- `needs-review` - #e17055 (orange) - Ready for your review
- `blocked` - #636e72 (gray) - Cannot proceed
- `in-progress` - #00b894 (green) - Currently working on

## Milestones

### Milestone 1: "Core Simplification" (Due: TBD)
Remove complex features, implement optimistic approach

### Milestone 2: "Wireframe Alignment" (Due: TBD)  
Update all wireframes to match simplified approach

### Milestone 3: "Documentation Complete" (Due: TBD)
Legal docs, FAQ, and final documentation

### Milestone 4: "MVP Ready" (Due: TBD)
All simplifications complete, ready for development

## Project Board Columns

1. **Backlog** - Not yet started
2. **In Progress** - Currently working
3. **Review** - Ready for your review
4. **Done** - Completed

## Issue Templates

### Simplification Issue Template
```markdown
## Description
Brief description of what needs to be simplified

## Current State
What currently exists that's too complex

## Desired State
What it should look like after simplification

## Files to Update
- [ ] File 1
- [ ] File 2

## Definition of Done
- [ ] Complex feature removed
- [ ] Wireframes updated
- [ ] Documentation aligned
```

### Wireframe Update Template
```markdown
## Wireframe
Which wireframe needs updating: `filename.md`

## Changes Needed
- [ ] Remove feature X
- [ ] Update section Y
- [ ] Align with principle Z

## Related Issues
Links to related simplification issues

## Definition of Done
- [ ] Wireframe updated
- [ ] Aligns with CLAUDE.md principles
- [ ] No contradictions with other wireframes
```

## How to Bulk Create Issues

1. Go to your GitHub repo: `github.com/caritos/tennis/issues`
2. Click "New Issue" for each todo item
3. Use the templates above
4. Add appropriate labels and milestone
5. Reference related issues with #issue-number

## Current Todos to Convert

### High Priority Issues (Simplification)
1. **Remove Match Confirmation System** - `simplification`, `priority: high`
2. **Implement Auto-Join Clubs** - `simplification`, `priority: high`  
3. **Remove Court Management** - `simplification`, `priority: high`
4. **Minimal Profile Setup** - `simplification`, `priority: high`
5. **Remove Contact Preferences** - `simplification`, `priority: high`
6. **Standardize Club Types** - `simplification`, `priority: high`

### Wireframe Updates (High Priority)
7. **Update match-recording-flow.md** - `wireframes`, `priority: high`
8. **Update club-joining-flow.md** - `wireframes`, `priority: high`
9. **Update authentication-screen.md** - `wireframes`, `priority: high`
10. **Update profile forms** - `wireframes`, `priority: high`

### Documentation Tasks
11. **Create Privacy Policy** - `documentation`, `legal`, `priority: high`
12. **Create Terms of Service** - `documentation`, `legal`, `priority: high`
13. **Create FAQ** - `documentation`, `priority: medium`
14. **Update Database Schema** - `documentation`, `database`, `priority: high`

### Medium Priority Simplifications
15. **Remove Activity Feeds** - `simplification`, `priority: medium`
16. **Remove Bio Fields** - `simplification`, `priority: medium`
17. **Simplify Notifications** - `simplification`, `priority: medium`
18. **Remove Achievements** - `simplification`, `priority: medium`
19. **Remove Doubles Team Rankings** - `simplification`, `priority: medium`

## Next Steps

1. **Create labels** in your GitHub repo settings
2. **Create milestones** in GitHub Issues
3. **Set up project board** (optional but recommended)
4. **Bulk create issues** using the list above
5. **Start with Milestone 1** (Core Simplification)

This will give you professional project management with clear tracking of all simplification work!