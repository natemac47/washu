(function executeRule(current, previous /*null when async*/) {
    // Step 1: Look up the awa_work_item table to find the matching work item based on document_id.interaction
    var workItem = new GlideRecord('awa_work_item');
    workItem.addQuery('document_id.interaction', current.sys_id);
    workItem.query();
    
    if (!workItem.next()) {
        return; // No matching work item found
    }
    
    // Step 2: Get the queue value from the matching awa_work_item record
    var queue = workItem.queue;
    if (!queue) {
        return; // No queue specified
    }
    
    // Step 3: Look up the awa_eligibility_pool table with the same queue value
    var eligibilityPool = new GlideRecord('awa_eligibility_pool');
    eligibilityPool.addQuery('queue', queue);
    eligibilityPool.query();
    
    if (!eligibilityPool.next()) {
        return; // No matching eligibility pool found
    }
    
    // Step 4: Get the groups from the awa_eligibility_pool record's 'groups' list collector field
    var groups = eligibilityPool.groups.split(',');
    if (groups.length === 0) {
        return; // No groups found
    }
    
    // Step 5: Get all users in those groups
    var usersInGroups = [];
    var groupMember = new GlideRecord('sys_user_grmember');
    groupMember.addQuery('group', 'IN', groups);
    groupMember.query();
    
    while (groupMember.next()) {
        usersInGroups.push(groupMember.user.sys_id.toString());
    }
    
    if (usersInGroups.length === 0) {
        return; // No users found in the groups
    }
    
    // Step 6: Compare those users with the awa_agent_presence_capacity table where the user is in the ap_agent field, ac_channel matches, and aca_available is true
    var availableAgents = [];
    var agentCapacity = new GlideRecord('awa_agent_presence_capacity');
    agentCapacity.addQuery('ap_agent', 'IN', usersInGroups);
    agentCapacity.addQuery('ac_channel', '27f675e3739713004a905ee515f6a7c3');
    agentCapacity.addQuery('aca_available', true);
    agentCapacity.query();
    
    while (agentCapacity.next()) {
        availableAgents.push(agentCapacity.ap_agent.toString());
    }
    
    if (availableAgents.length === 0) {
        return; // No available agents found
    }
    
    // Step 7: Create an event with parm1 set to the sys_ids of the matching available agents
    gs.eventQueue('vip_agents.availability_check', current, availableAgents.join(','), null);

})(current, previous);
