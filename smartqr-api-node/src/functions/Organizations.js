const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken, isBusinessEmail, deriveOrgName } = require('../utils/auth');

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
                    // Organization exists — add employee count increment
                    const updatedOrg = {
                        ...existingOrg,
                        employeeCount: (existingOrg.employeeCount || 1) + 1,
                        lastJoinedBy: authUser.email,
                        lastJoinedAt: new Date().toISOString()
                    };
                    await organizations.items.upsert(updatedOrg);

                    return {
                        status: 200,
                        jsonBody: {
                            message: "Joined existing organization workspace",
                            organization: {
                                domain: existingOrg.domain,
                                name: existingOrg.name,
                                employeeCount: updatedOrg.employeeCount
                            }
                        }
                    };
                }
            } catch (e) {
                // Organization doesn't exist, we'll create it below
            }

            // Create new organization
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
                employeeCount: 1
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
                    }
                }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});

// GET /api/getOrganization — Get current user's organization profile
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
                                employeeCount: org.employeeCount,
                                createdAt: org.createdAt
                            },
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
