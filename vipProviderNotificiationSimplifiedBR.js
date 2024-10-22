//went off of pending_accept AWA work items instead of queue lookup and cross-referencing with awa presence state table

(function executeRule(current, previous /*null when async*/) {
    var assignedAgents = [];

    var workItem = new GlideRecord('awa_work_item');
    workItem.addQuery('document_id.interaction', current.sys_id);
    workItem.addQuery('active', true);
	workItem.addQuery('state', 'pending_accept');
    workItem.query();

    while (workItem.next()) {
        var assignedTo = workItem.getValue('assigned_to');
        if (assignedTo) {
            if (assignedAgents.indexOf(assignedTo) === -1) {
                assignedAgents.push(assignedTo);
            }
        }
    }

    if (assignedAgents.length > 0) {
        gs.eventQueue('vip_agents.availability_check', current, assignedAgents.join(','), null);
    }
})(current, previous);
