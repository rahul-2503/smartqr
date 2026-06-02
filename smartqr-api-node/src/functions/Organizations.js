const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken, verifyRole, isBusinessEmail, deriveOrgName } = require('../utils/auth');

// POST /api/registerOrganization — Create or join an organization
app.http('RegisterOrganization', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'registerOrganization',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            if (!authUser.isBusinessEmail) {
                return { status: 403, jsonBody: { error: "Registration requires a verified organization email. Personal emails (Gmail, Yahoo, etc.) are not permitted." } };
            }

            const data = await request.json();
            const { organizations } = await getContainers();
            const domain = authUser.organizationDomain;

            // Check if organization already exists
            try {
                const { resource: existingOrg } = await organizations.item(domain, domain).read();
                if (existingOrg) {
                    // Organization exists — add user as employee member
                    const members = existingOrg.members || [];
                    const alreadyMember = members.find(m => m.uid === authUser.uid || m.email === authUser.email);

                    if (!alreadyMember) {
                        members.push({
                            uid: authUser.uid,
                            email: authUser.email,
                            role: 'employee',
                            joinedAt: new Date().toISOString()
                        });
                    }

                    const updatedOrg = {
                        ...existingOrg,
                        members: members,
                        employeeCount: members.length,
                        lastJoinedBy: authUser.email,
                        lastJoinedAt: new Date().toISOString()
                    };
                    await organizations.items.upsert(updatedOrg);

                    const userRole = alreadyMember ? alreadyMember.role : 'employee';

                    return {
                        status: 200,
                        jsonBody: {
                            message: "Joined existing organization workspace",
                            organization: {
                                domain: existingOrg.domain,
                                name: existingOrg.name,
                                employeeCount: members.length
                            },
                            role: userRole
                        }
                    };
                }
            } catch (e) {
                // Organization doesn't exist, we'll create it below
            }

            // Create new organization — registering user becomes owner
            const orgItem = {
                id: domain,
                domain: domain,
                name: data.companyName || deriveOrgName(domain),
                licenseNo: data.licenseNo || "",
                gstNo: data.gstNo || "",
                address: data.address || "",
                state: data.state || "",
                contactName: data.contactName || "",
                contactEmail: authUser.email,
                contactPhone: data.phone || "",
                createdBy: authUser.uid,
                createdByEmail: authUser.email,
                createdAt: new Date().toISOString(),
                employeeCount: 1,
                members: [{
                    uid: authUser.uid,
                    email: authUser.email,
                    role: 'owner',
                    joinedAt: new Date().toISOString()
                }]
            };

            await organizations.items.create(orgItem);

            return {
                status: 201,
                jsonBody: {
                    message: "Organization registered successfully!",
                    organization: {
                        domain: orgItem.domain,
                        name: orgItem.name,
                        employeeCount: 1
                    },
                    role: 'owner'
                }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});

// GET /api/getOrganization — Get current user's organization profile + role
app.http('GetOrganization', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'getOrganization',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const { organizations } = await getContainers();
            const domain = authUser.organizationDomain;

            try {
                const { resource: org } = await organizations.item(domain, domain).read();
                if (org) {
                    // Auto-migrate legacy orgs without members array
                    if (!org.members || !Array.isArray(org.members)) {
                        org.members = [{
                            uid: org.createdBy,
                            email: org.createdByEmail,
                            role: 'owner',
                            joinedAt: org.createdAt || new Date().toISOString()
                        }];
                        org.employeeCount = org.members.length;
                        await organizations.items.upsert(org);
                    }

                    // Find user's role
                    const member = org.members.find(m => m.uid === authUser.uid || m.email === authUser.email);
                    const userRole = member ? member.role : 'employee';

                    return {
                        status: 200,
                        jsonBody: {
                            organization: {
                                domain: org.domain,
                                name: org.name,
                                licenseNo: org.licenseNo,
                                gstNo: org.gstNo,
                                address: org.address,
                                state: org.state,
                                contactName: org.contactName,
                                contactEmail: org.contactEmail,
                                contactPhone: org.contactPhone,
                                employeeCount: org.members.length,
                                createdAt: org.createdAt,
                                members: org.members
                            },
                            role: userRole,
                            employee: {
                                uid: authUser.uid,
                                email: authUser.email
                            }
                        }
                    };
                }
            } catch (e) {
                // Not found
            }

            return { status: 404, jsonBody: { error: "Organization not found. Please complete registration." } };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});

// PUT /api/updateOrganization — Owner-only: Update organization details
app.http('UpdateOrganization', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'updateOrganization',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            // Verify owner role
            let roleData;
            try {
                roleData = await verifyRole(authUser, 'owner');
            } catch (roleErr) {
                return { status: roleErr.statusCode || 403, jsonBody: { error: roleErr.message } };
            }

            const data = await request.json();
            const { organizations, auditLogs } = await getContainers();
            const org = roleData.organization;

            // Update allowed fields only
            const updatedOrg = {
                ...org,
                name: data.companyName || org.name,
                licenseNo: data.licenseNo !== undefined ? data.licenseNo : org.licenseNo,
                gstNo: data.gstNo !== undefined ? data.gstNo : org.gstNo,
                address: data.address !== undefined ? data.address : org.address,
                state: data.state !== undefined ? data.state : org.state,
                contactName: data.contactName !== undefined ? data.contactName : org.contactName,
                contactPhone: data.phone !== undefined ? data.phone : org.contactPhone,
                updatedAt: new Date().toISOString(),
                updatedBy: authUser.email
            };

            await organizations.items.upsert(updatedOrg);

            // Audit Trail
            await auditLogs.items.create({
                id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
                organizationDomain: authUser.organizationDomain,
                action: "UPDATE_ORGANIZATION",
                actor: authUser.email,
                details: `Updated organization details for ${updatedOrg.name}`,
                entityType: "organization",
                timestamp: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: {
                    message: "Organization updated successfully!",
                    organization: {
                        domain: updatedOrg.domain,
                        name: updatedOrg.name,
                        licenseNo: updatedOrg.licenseNo,
                        gstNo: updatedOrg.gstNo,
                        address: updatedOrg.address,
                        state: updatedOrg.state,
                        contactName: updatedOrg.contactName,
                        contactPhone: updatedOrg.contactPhone
                    }
                }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});

// DELETE /api/deleteOrganization — Owner-only: Delete organization and ALL data
app.http('DeleteOrganization', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'deleteOrganization',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            // Verify owner role
            let roleData;
            try {
                roleData = await verifyRole(authUser, 'owner');
            } catch (roleErr) {
                return { status: roleErr.statusCode || 403, jsonBody: { error: roleErr.message } };
            }

            const { organizations, medicineProducts, smartBatches, scans, auditLogs } = await getContainers();
            const domain = authUser.organizationDomain;

            // Delete all products for this org
            const { resources: products } = await medicineProducts.items
                .query({ query: "SELECT c.id FROM c WHERE c.organizationDomain = @d", parameters: [{ name: "@d", value: domain }] })
                .fetchAll();
            for (const p of products) {
                try { await medicineProducts.item(p.id, domain).delete(); } catch (e) { /* skip */ }
            }

            // Delete all batches for this org
            const { resources: batches } = await smartBatches.items
                .query({ query: "SELECT c.id FROM c WHERE c.organizationDomain = @d", parameters: [{ name: "@d", value: domain }] })
                .fetchAll();
            for (const b of batches) {
                try { await smartBatches.item(b.id, domain).delete(); } catch (e) { /* skip */ }
            }

            // Delete all scans for this org
            const { resources: scanRecords } = await scans.items
                .query({ query: "SELECT c.id FROM c WHERE c.organizationDomain = @d", parameters: [{ name: "@d", value: domain }] })
                .fetchAll();
            for (const s of scanRecords) {
                try { await scans.item(s.id, domain).delete(); } catch (e) { /* skip */ }
            }

            // Delete all audit logs for this org
            const { resources: logs } = await auditLogs.items
                .query({ query: "SELECT c.id FROM c WHERE c.organizationDomain = @d", parameters: [{ name: "@d", value: domain }] })
                .fetchAll();
            for (const l of logs) {
                try { await auditLogs.item(l.id, domain).delete(); } catch (e) { /* skip */ }
            }

            // Delete the organization record itself
            await organizations.item(domain, domain).delete();

            return {
                status: 200,
                jsonBody: {
                    message: "Organization and all associated data deleted permanently.",
                    deletedCounts: {
                        products: products.length,
                        batches: batches.length,
                        scans: scanRecords.length,
                        auditLogs: logs.length
                    }
                }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});

// PUT /api/updateMemberRole — Owner-only: Promote/demote a member
app.http('UpdateMemberRole', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'updateMemberRole',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            let roleData;
            try {
                roleData = await verifyRole(authUser, 'owner');
            } catch (roleErr) {
                return { status: roleErr.statusCode || 403, jsonBody: { error: roleErr.message } };
            }

            const data = await request.json();
            const { targetUid, newRole } = data;

            if (!targetUid || !['owner', 'employee'].includes(newRole)) {
                return { status: 400, jsonBody: { error: "Invalid request. Provide targetUid and newRole ('owner' or 'employee')." } };
            }

            const { organizations, auditLogs } = await getContainers();
            const org = roleData.organization;

            const memberIndex = org.members.findIndex(m => m.uid === targetUid);
            if (memberIndex === -1) {
                return { status: 404, jsonBody: { error: "Member not found in this organization." } };
            }

            // Prevent owner from demoting themselves if they're the only owner
            if (org.members[memberIndex].uid === authUser.uid && newRole !== 'owner') {
                const ownerCount = org.members.filter(m => m.role === 'owner').length;
                if (ownerCount <= 1) {
                    return { status: 400, jsonBody: { error: "Cannot demote yourself. You are the only owner. Promote another member first." } };
                }
            }

            const previousRole = org.members[memberIndex].role;
            org.members[memberIndex].role = newRole;
            await organizations.items.upsert(org);

            // Audit Trail
            await auditLogs.items.create({
                id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
                organizationDomain: authUser.organizationDomain,
                action: "UPDATE_MEMBER_ROLE",
                actor: authUser.email,
                details: `Changed ${org.members[memberIndex].email} role from ${previousRole} to ${newRole}`,
                entityType: "member",
                timestamp: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: {
                    message: `Member role updated to ${newRole}`,
                    member: org.members[memberIndex]
                }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});

// DELETE /api/removeMember/{uid} — Owner removes a member, or employee removes self
app.http('RemoveMember', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'removeMember/{uid}',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const targetUid = request.params.uid;
            const isSelfRemoval = targetUid === authUser.uid;

            // If removing someone else, require owner role
            let roleData;
            try {
                roleData = await verifyRole(authUser, isSelfRemoval ? 'employee' : 'owner');
            } catch (roleErr) {
                return { status: roleErr.statusCode || 403, jsonBody: { error: roleErr.message } };
            }

            const { organizations, auditLogs } = await getContainers();
            const org = roleData.organization;

            const memberIndex = org.members.findIndex(m => m.uid === targetUid);
            if (memberIndex === -1) {
                return { status: 404, jsonBody: { error: "Member not found." } };
            }

            // Prevent removing the last owner
            const targetMember = org.members[memberIndex];
            if (targetMember.role === 'owner') {
                const ownerCount = org.members.filter(m => m.role === 'owner').length;
                if (ownerCount <= 1) {
                    return { status: 400, jsonBody: { error: "Cannot remove the last owner. Transfer ownership first." } };
                }
            }

            const removedEmail = targetMember.email;
            org.members.splice(memberIndex, 1);
            org.employeeCount = org.members.length;
            await organizations.items.upsert(org);

            // Audit Trail
            await auditLogs.items.create({
                id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
                organizationDomain: authUser.organizationDomain,
                action: isSelfRemoval ? "MEMBER_LEFT" : "MEMBER_REMOVED",
                actor: authUser.email,
                details: isSelfRemoval ? `${removedEmail} left the organization` : `Removed ${removedEmail} from organization`,
                entityType: "member",
                timestamp: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: {
                    message: isSelfRemoval ? "You have left the organization." : `Member ${removedEmail} removed.`,
                    removedEmail
                }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
