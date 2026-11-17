-- Nexora Web Dev. Academy — migration 003: REPLACE access-code batch (owner instruction, 17 Nov 2026).
-- WIPE: deletes every row in code_redemptions + access_codes (old batch, incl. the 30
-- hashes from migration 002 / spec Appendix A) BEFORE inserting the fresh batch.
-- Only run this when NO student has redeemed an old code yet (verified: tables were
-- only just created; redemptions = 0). Never run a wipe after real redemptions exist
-- without an owner-approved backup + audit note.
-- SECURITY: ONLY SHA-256 hashes are stored here. Plaintext codes are NOT in this
-- file, NOT in the repository, NOT in docs, logs or UI. The plaintext list for this
-- batch was handed privately to the academy owner (David) on 17 Nov 2026.
-- Idempotent: rerunning re-inserts the same 30 hashes (ON CONFLICT DO NOTHING);
-- the DELETEs make a rerun safe only while redemptions are still 0.
-- Verify after applying: SELECT status, count(*) FROM public.access_codes GROUP BY status; -- expect unused = 30

delete from public.code_redemptions;
delete from public.access_codes;

INSERT INTO public.access_codes (code_hash, status) VALUES ('508003ae1b349b02a547e8d7486e54cbab673014b3537e7072b1979c84e0f3a5', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #01
INSERT INTO public.access_codes (code_hash, status) VALUES ('1291fef51c3869b13d606e43262d8a3844be6e0f0f1237707211a1152419c341', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #02
INSERT INTO public.access_codes (code_hash, status) VALUES ('fa369b7ac8146f27c37d7d5e45c056b0ef88b6afe3472e8eeeeb558571e01a71', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #03
INSERT INTO public.access_codes (code_hash, status) VALUES ('7b761a44eae40a3a559cfcf687d93a7dcc551f87d72bb69e67525a54a09ad537', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #04
INSERT INTO public.access_codes (code_hash, status) VALUES ('c0909433624c482fcd1cc3fc40464b905321598fefe77709e7858d47c154228f', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #05
INSERT INTO public.access_codes (code_hash, status) VALUES ('c473e617ee018174b68c749892016da77c6fb0cc6a965098a3894680289c00b7', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #06
INSERT INTO public.access_codes (code_hash, status) VALUES ('a61a3e35889a89a60370e20236f6c7b189472a559a5db8732525e234e9a99978', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #07
INSERT INTO public.access_codes (code_hash, status) VALUES ('af07f68601fbc71f366c2f4938f7e098e8424207747b2effbf80934209182882', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #08
INSERT INTO public.access_codes (code_hash, status) VALUES ('2ee2fafec738cf8760c863bd622e36924308bdfb1cd7d13efb3512d12804513a', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #09
INSERT INTO public.access_codes (code_hash, status) VALUES ('c604fc03fd37bdb0bd63258ddabe21901c303e613412f78c65fe66240e9992e8', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #10
INSERT INTO public.access_codes (code_hash, status) VALUES ('1625e6d4840e40e552567d7404dba2bed228e9586866215eda5d4e3db28b437d', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #11
INSERT INTO public.access_codes (code_hash, status) VALUES ('09e0f49dccb21a06f0f49144e2e79a725116834df6ec718d846fd0ba02ef21f4', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #12
INSERT INTO public.access_codes (code_hash, status) VALUES ('3370851c774fdaa5e609859db3d93411dd0678751d9c34a445fcb1baf67135e5', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #13
INSERT INTO public.access_codes (code_hash, status) VALUES ('a6a690f698c3e5a1030af6364c42c8df65986590f6a15ea1ebd7836c7a7cbe7a', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #14
INSERT INTO public.access_codes (code_hash, status) VALUES ('bc68cb16fec57cc547aaa6bee01c9b7a6190b50915fa48c6b76a6484e265eda5', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #15
INSERT INTO public.access_codes (code_hash, status) VALUES ('6bc0e24f65ac92f71bc5aa431f89a85fb6c7aab62e041cf2b12969214ddc1ae2', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #16
INSERT INTO public.access_codes (code_hash, status) VALUES ('aceee7d951939f4e7e87df75cffaca5c39a6c154d7bca279c1dbe82a24d72180', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #17
INSERT INTO public.access_codes (code_hash, status) VALUES ('cf90179b1cacf050fa1ebad9aa6ac1cbec02010eb066417efea75db673ae1ebe', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #18
INSERT INTO public.access_codes (code_hash, status) VALUES ('eafa45fa4198039a7cdda19d59e880086e380a04de904b3fd314e88bee1ebca2', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #19
INSERT INTO public.access_codes (code_hash, status) VALUES ('5af6c32ca79dcf9145ad2942aa80e89c1374db9cb174907481fbf2dd6ebc71b2', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #20
INSERT INTO public.access_codes (code_hash, status) VALUES ('9582e9850701518f7fd854e9a0f1aa7051e92a3215ab1a1d8191f2021531c9f3', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #21
INSERT INTO public.access_codes (code_hash, status) VALUES ('cd63b47a3a62903cc5b2f5f55cff5faeb45605d2da1ac54ab0ffcb0bbec0bf1c', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #22
INSERT INTO public.access_codes (code_hash, status) VALUES ('52b297ef12536b548ca3c7f172f14a3e1b6ee17882e99e1d7bfbb9b8a43aecdb', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #23
INSERT INTO public.access_codes (code_hash, status) VALUES ('8cc7989e670933a7ac27d6afd708570eacbd88d3079e3022dea2cb39539b70ce', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #24
INSERT INTO public.access_codes (code_hash, status) VALUES ('ea54ea1ef926ed00f63a756c9ea16878ecdd5d4f0d458d26920bb4e6da11d1bf', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #25
INSERT INTO public.access_codes (code_hash, status) VALUES ('32f3a418f9c3317ee451b491459a0a0ced83eb15cd0f0e4edff45c99db0e3852', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #26
INSERT INTO public.access_codes (code_hash, status) VALUES ('dc27bfc982ea5cf92d5a276b4475abc4cb03407aa90bdfdfc9d71e1993e70f50', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #27
INSERT INTO public.access_codes (code_hash, status) VALUES ('259ad033db5311f9c9f86c71e0fed043c94fbac2610daf6fe06a68bfbba3ff4e', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #28
INSERT INTO public.access_codes (code_hash, status) VALUES ('3b74d50589251d4888a4b62714b4c904ba2b531d5a351d4307038eef4852c3a7', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #29
INSERT INTO public.access_codes (code_hash, status) VALUES ('92c24563abdfc518a060bdc005d9aa0fcbef12e61e987874aa30f86bfb608936', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- batch-2 code #30

-- Verification: SELECT status, count(*) FROM public.access_codes GROUP BY status; -- expect unused = 30
