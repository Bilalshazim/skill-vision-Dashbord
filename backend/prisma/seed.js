// Realistic fixtures for local dev + the "at minimum" test list in Phase
// 30 §20. Mirrors the legacy shell's demo accounts in spirit (four users,
// one of them literally "Roberto") without reusing its plaintext-password
// pattern — see js/app.js's USERS array for the thing this replaces.
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password.js';
const prisma = new PrismaClient();
async function main() {
    const platform = await prisma.platform.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: { id: '00000000-0000-0000-0000-000000000001', name: 'Skill-Vision — VR reseller instance', status: 'ACTIVE', activatedAt: new Date() },
    });
    const seller = await prisma.sellerCode.upsert({
        where: { code: 'VR' },
        update: {},
        create: { code: 'VR', label: 'Venditore di riferimento' },
    });
    const company = await prisma.company.upsert({
        where: { id: '00000000-0000-0000-0000-000000000002' },
        update: {},
        create: { id: '00000000-0000-0000-0000-000000000002', platformId: platform.id, name: 'Acme Corp', status: 'ACTIVE' },
    });
    const [platformAdmin, companyAdmin, recruiter] = await Promise.all([
        prisma.user.upsert({
            where: { email: 'admin@skill-vision.it' },
            update: {},
            create: { email: 'admin@skill-vision.it', passwordHash: await hashPassword('admin123'), fullName: 'Roberto Feliciani', role: 'PLATFORM_ADMIN' },
        }),
        prisma.user.upsert({
            where: { email: 'hr@acme.example' },
            update: {},
            create: { email: 'hr@acme.example', passwordHash: await hashPassword('acme123'), fullName: 'Marco Bianchi', role: 'COMPANY_ADMIN', companyId: company.id },
        }),
        prisma.user.upsert({
            where: { email: 'recruiter@acme.example' },
            update: {},
            create: { email: 'recruiter@acme.example', passwordHash: await hashPassword('acme123'), fullName: 'Giulia Verdi', role: 'RECRUITER', companyId: company.id },
        }),
    ]);
    const campaign = await prisma.campaign.upsert({
        where: { id: '00000000-0000-0000-0000-000000000003' },
        update: {},
        create: { id: '00000000-0000-0000-0000-000000000003', companyId: company.id, name: 'Sales Account Manager — Q1', status: 'ACTIVE', openedAt: new Date() },
    });
    await prisma.senderConfig.upsert({
        where: { id: '00000000-0000-0000-0000-000000000004' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000004',
            companyId: company.id,
            senderType: 'COMPANY_HR',
            displayName: 'Marco Bianchi — Acme HR',
            replyToEmail: 'hr@acme.example',
            createdById: companyAdmin.id,
        },
    });
    const candidateA = await prisma.candidate.upsert({
        where: { id: '00000000-0000-0000-0000-000000000005' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000005',
            fullName: 'Laura Bianchi',
            email: 'laura.bianchi@example.com',
            normalizedEmail: 'laura.bianchi@example.com',
            source: 'NEW_APPLICANT',
        },
    });
    const candidateB = await prisma.candidate.upsert({
        where: { id: '00000000-0000-0000-0000-000000000006' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000006',
            fullName: 'Marco Neri',
            email: 'marco.neri@example.com',
            normalizedEmail: 'marco.neri@example.com',
            source: 'ARCHIVE',
        },
    });
    await prisma.campaignCandidate.upsert({
        where: { campaignId_candidateId: { campaignId: campaign.id, candidateId: candidateA.id } },
        update: {},
        create: { campaignId: campaign.id, candidateId: candidateA.id, roleApplied: 'Sales Account Manager', icvScore: 82 },
    });
    await prisma.campaignCandidate.upsert({
        where: { campaignId_candidateId: { campaignId: campaign.id, candidateId: candidateB.id } },
        update: {},
        create: { campaignId: campaign.id, candidateId: candidateB.id, roleApplied: 'Sales Account Manager', icvScore: 64 },
    });
    const evaluatorSeeds = [
        { fullName: 'Marco Bianchi', email: 'hr@acme.example', role: 'HR', userId: companyAdmin.id },
        { fullName: 'Sara Colombo', email: 'sara.colombo@acme.example', role: 'MANAGER' },
        { fullName: 'Elena Ferrari', email: 'elena.ferrari@acme.example', role: 'DIRETTORE_HR' },
    ];
    const evaluators = [];
    for (const e of evaluatorSeeds) {
        const existing = await prisma.evaluator.findFirst({ where: { email: e.email } });
        evaluators.push(existing ?? (await prisma.evaluator.create({ data: { ...e, companyId: company.id } })));
    }
    console.log('Seeded:', {
        platform: platform.name,
        seller: seller.code,
        company: company.name,
        campaign: campaign.name,
        users: [platformAdmin.email, companyAdmin.email, recruiter.email],
        candidates: [candidateA.fullName, candidateB.fullName],
        evaluators: evaluators.map((e) => e.fullName),
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map