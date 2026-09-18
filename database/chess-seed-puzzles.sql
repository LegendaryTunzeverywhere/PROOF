-- ============================================================================
-- Chess Puzzle Seed Data
-- ============================================================================
-- Seeds initial chess puzzles for curriculum topics
-- Run after chess-tables.sql
-- ============================================================================

-- ============================================================================
-- Level 1: Fundamental Tactics
-- ============================================================================

-- Topic 4: Pins, Forks, Skewers
-- Puzzle 1: Simple Pin
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-pin-1', 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5', 'puzzle', 'w', 'Pin the knight to the king');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-pin-1', 'pos-pin-1', 'Pin to Win', 'beginner', ARRAY['pin']::chess_puzzle_theme[], 
   ARRAY['Bxf7+', 'Nxe5+'], 
   'After Bxf7+ Kxf7, the knight on e5 is pinned to the king by the bishop on c4. White wins material.',
   ARRAY['Look for pieces on the same line as the king', 'The bishop on f7 check forces the king to move'],
   1250, 'fundamental-tactics');

-- Puzzle 2: Knight Fork
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-fork-1', 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', 'puzzle', 'w', 'Knight fork on e5');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-fork-1', 'pos-fork-1', 'Royal Fork', 'beginner', ARRAY['fork', 'double-attack']::chess_puzzle_theme[], 
   ARRAY['Nxe5'], 
   'Nxe5 forks the king on e8 and the rook on c6, winning the exchange.',
   ARRAY['Knights can attack multiple pieces at once', 'Look for a central square that attacks two pieces'],
   1200, 'fundamental-tactics');

-- Puzzle 3: Back Rank Mate
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-backrank-1', 'r5k1/ppp2ppp/8/8/8/8/PPP2PPP/4R1K1 w - - 0 1', 'puzzle', 'w', 'Back rank checkmate');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-backrank-1', 'pos-backrank-1', 'Back Rank Basics', 'beginner', ARRAY['back-rank']::chess_puzzle_theme[], 
   ARRAY['Re8+', 'Rxe8', 'Rxe8#'], 
   'Re8+ forces Rxe8, then Rxe8# is checkmate on the back rank.',
   ARRAY['The black king has no escape squares', 'Look for a rook move to the 8th rank'],
   1180, 'fundamental-tactics');

-- ============================================================================
-- Level 2: Advanced Tactics
-- ============================================================================

-- Topic 8: Discovery, Deflection, Decoy
-- Puzzle 4: Discovered Attack
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-discovery-1', 'r1bq1rk1/ppp2ppp/2n5/3p4/1b1P4/2NB1N2/PPP2PPP/R1BQ1RK1 w - - 0 9', 'puzzle', 'w', 'Discovered attack wins material');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-discovery-1', 'pos-discovery-1', 'Discovery Power', 'intermediate', ARRAY['discovery']::chess_puzzle_theme[], 
   ARRAY['Nxd5'], 
   'Nxd5 discovers an attack on the bishop on b4 from the bishop on d3, winning material.',
   ARRAY['Look for pieces aligned on diagonals', 'Moving the knight reveals a powerful attack'],
   1450, 'tactical-motifs');

-- Puzzle 5: Deflection
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-deflection-1', '2kr3r/ppp2ppp/2n5/3Pp3/2P5/2N5/PP3PPP/R1B1K2R w KQ - 0 10', 'puzzle', 'w', 'Deflect the defender');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-deflection-1', 'pos-deflection-1', 'Deflect and Destroy', 'intermediate', ARRAY['deflection']::chess_puzzle_theme[], 
   ARRAY['Rxc6', 'bxc6', 'Ba3+'], 
   'Rxc6 deflects the pawn from defending the king. After bxc6, Ba3+ wins.',
   ARRAY['Sacrifice to remove a key defender', 'The b7 pawn is overworked'],
   1520, 'tactical-motifs');

-- Puzzle 6: Greek Gift Sacrifice
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-greek-gift-1', 'rn1qkb1r/pbpp1ppp/1p2pn2/8/2PP4/5NP1/PP2PPBP/RNBQK2R w KQkq - 0 6', 'puzzle', 'w', 'Classic Greek Gift');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-greek-gift-1', 'pos-greek-gift-1', 'Greek Gift Attack', 'intermediate', ARRAY['greek-gift']::chess_puzzle_theme[], 
   ARRAY['Bxh7+', 'Kxh7', 'Ng5+', 'Kg6', 'Qg4'], 
   'Bxh7+ Kxh7 Ng5+ forces the king out. After Kg6 Qg4, White has a strong attack.',
   ARRAY['Sacrifice the bishop on h7', 'The exposed king becomes vulnerable to attack'],
   1580, 'king-safety');

-- ============================================================================
-- Level 3: Complex Tactics
-- ============================================================================

-- Puzzle 7: Zwischenzug (Intermediate Move)
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-zwischenzug-1', 'r1bq1rk1/pp3pbp/2np1np1/2p1p3/2P1P3/2NP1NP1/PP2PPBP/R1BQ1RK1 b - - 0 9', 'puzzle', 'b', 'In-between move wins material');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-zwischenzug-1', 'pos-zwischenzug-1', 'The Intermediate Strike', 'advanced', ARRAY['zwischenzug']::chess_puzzle_theme[], 
   ARRAY['Nxe4', 'Nxe4', 'Bxc3'], 
   'After Nxe4, instead of recapturing immediately, play the in-between move Bxc3, winning the knight.',
   ARRAY['Don''t recapture immediately', 'Look for a forcing move before recapturing'],
   1680, 'advanced-tactics');

-- Puzzle 8: Windmill
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-windmill-1', '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', 'puzzle', 'w', 'Windmill tactic (simplified example)');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-windmill-1', 'pos-windmill-1', 'The Windmill', 'advanced', ARRAY['windmill']::chess_puzzle_theme[], 
   ARRAY['Re8+', 'Kh7', 'Re7'], 
   'Re8+ Kh7 Re7 is a simple windmill pattern. In real games, this continues with discovered checks.',
   ARRAY['Repeated discovered checks', 'The rook can capture material while giving discovered checks'],
   1750, 'advanced-tactics');

-- ============================================================================
-- Opening Puzzles
-- ============================================================================

-- Puzzle 9: Opening Trap - Fried Liver Attack
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-opening-1', 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', 'puzzle', 'w', 'Fried Liver Attack');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-opening-1', 'pos-opening-1', 'Fried Liver Attack', 'intermediate', ARRAY['fork']::chess_puzzle_theme[], 
   ARRAY['Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7'], 
   'Ng5 attacks f7. After d5 exd5 Nxd5 Nxf7! sacrifices the knight for a strong attack.',
   ARRAY['Attack the weak f7 square', 'Knight sacrifice leads to king exposure'],
   1500, 'opening-systems-e4');

-- Puzzle 10: Opening Principle Violation
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-opening-2', 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'puzzle', 'w', 'Follow opening principles');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-opening-2', 'pos-opening-2', 'Develop Pieces First', 'beginner', ARRAY[]::chess_puzzle_theme[], 
   ARRAY['Nf3'], 
   'Nf3 develops a piece while attacking e5. Better than Qh5 which brings the queen out too early.',
   ARRAY['Develop knights before bishops', 'Don''t bring the queen out too early'],
   1150, 'opening-principles');

-- ============================================================================
-- Endgame Puzzles
-- ============================================================================

-- Puzzle 11: Lucena Position
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-endgame-1', '4K3/4P3/4k3/8/8/8/8/5R2 w - - 0 1', 'puzzle', 'w', 'Lucena position winning technique');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-endgame-1', 'pos-endgame-1', 'Lucena Position', 'intermediate', ARRAY[]::chess_puzzle_theme[], 
   ARRAY['Rf4', 'Kxe7', 'Re4+'], 
   'Rf4 prepares to build a bridge. After Kxe7 Re4+ shields the king from checks.',
   ARRAY['Build a bridge with the rook', 'Use the rook to shield your king from checks'],
   1480, 'complex-endgames');

-- Puzzle 12: Opposition
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-endgame-2', '8/8/8/4k3/8/4K3/4P3/8 w - - 0 1', 'puzzle', 'w', 'Use opposition to win');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-endgame-2', 'pos-endgame-2', 'Opposition Wins', 'beginner', ARRAY[]::chess_puzzle_theme[], 
   ARRAY['Kd3', 'Kd5', 'e4+', 'Kd6', 'Kd4'], 
   'Kd3 maintains opposition. After Kd5 e4+ Kd6 Kd4, White advances the pawn to promotion.',
   ARRAY['Take the opposition', 'Kings facing each other with one square between'],
   1280, 'elementary-endgames');

-- Puzzle 13: Queen vs Rook Endgame
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-endgame-3', '8/8/8/3k4/8/3K4/3Q4/6r1 w - - 0 1', 'puzzle', 'w', 'Queen vs Rook winning technique');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-endgame-3', 'pos-endgame-3', 'Queen vs Rook', 'advanced', ARRAY[]::chess_puzzle_theme[], 
   ARRAY['Qb4+', 'Kc6', 'Qa4+', 'Kd6', 'Qxg1'], 
   'Qb4+ Kc6 Qa4+ Kd6 Qxg1 wins the rook with checks forcing the king away.',
   ARRAY['Use checks to win the rook', 'Force the king away from defending the rook'],
   1620, 'complex-endgames');

-- ============================================================================
-- Mate in 2 Puzzles
-- ============================================================================

-- Puzzle 14: Smothered Mate
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-mate2-1', 'r1b1kb1r/pppp1ppp/5n2/4q3/2B1n3/3Q1N2/PPP2PPP/RNB1K2R w KQkq - 0 7', 'puzzle', 'w', 'Smothered mate in 2');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-mate2-1', 'pos-mate2-1', 'Smothered Mate', 'intermediate', ARRAY['smothered-mate']::chess_puzzle_theme[], 
   ARRAY['Qd8+', 'Nxd8', 'Nf7#'], 
   'Qd8+ forces Nxd8, then Nf7# is smothered checkmate. The king has no escape squares.',
   ARRAY['Sacrifice the queen', 'The knight delivers checkmate on f7'],
   1550, 'advanced-tactics');

-- Puzzle 15: Back Rank Mate in 2
INSERT INTO "ChessPosition" ("id", "fen", "type", "sideToMove", "description")
VALUES 
  ('pos-mate2-2', '6k1/5ppp/8/8/8/8/5PPP/4RR1K w - - 0 1', 'puzzle', 'w', 'Back rank mate in 2');

INSERT INTO "ChessPuzzle" ("id", "positionId", "title", "difficulty", "themes", "solution", "solutionExplanation", "hints", "rating", "topicSlug")
VALUES 
  ('puzzle-mate2-2', 'pos-mate2-2', 'Back Rank Mate in 2', 'beginner', ARRAY['back-rank']::chess_puzzle_theme[], 
   ARRAY['Re8+', 'Rxe8', 'Rxe8#'], 
   'Re8+ forces Rxe8, then Rxe8# is checkmate on the back rank.',
   ARRAY['The black king is trapped on the back rank', 'Use both rooks to deliver mate'],
   1220, 'fundamental-tactics');

-- ============================================================================
-- Statistics
-- ============================================================================

DO $$
DECLARE
  v_position_count INTEGER;
  v_puzzle_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_position_count FROM "ChessPosition";
  SELECT COUNT(*) INTO v_puzzle_count FROM "ChessPuzzle";
  
  RAISE NOTICE '✅ Chess puzzles seeded successfully!';
  RAISE NOTICE '📊 Created % positions', v_position_count;
  RAISE NOTICE '🧩 Created % puzzles', v_puzzle_count;
  RAISE NOTICE '';
  RAISE NOTICE '📚 Coverage:';
  RAISE NOTICE '   - Level 1 Fundamentals: 3 puzzles';
  RAISE NOTICE '   - Level 2 Intermediate: 3 puzzles';
  RAISE NOTICE '   - Level 3 Advanced: 2 puzzles';
  RAISE NOTICE '   - Opening: 2 puzzles';
  RAISE NOTICE '   - Endgame: 3 puzzles';
  RAISE NOTICE '   - Mate in 2: 2 puzzles';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Themes covered:';
  RAISE NOTICE '   pin, fork, skewer, discovery, deflection, decoy,';
  RAISE NOTICE '   greek-gift, zwischenzug, windmill, smothered-mate, back-rank';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next: Add more puzzles using similar INSERT statements';
  RAISE NOTICE '💡 Use get_random_puzzles() function to fetch puzzles for challenges';
END $$;
